const http = require('http');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

// 配置
const PORT = 8080;
const DATA_DIR = path.join(__dirname, 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 配置文件路径
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// 内存中的配置（用于快速读取）
let configCache = null;
let usersCache = null;
let cacheTime = 0;

// 客户端连接列表（用于推送更新）
const clients = new Set();

// 读取JSON文件（带缓存）
function readJSON(filePath, useCache = true) {
    const now = Date.now();
    
    // 检查缓存是否有效（5秒内使用缓存）
    if (useCache && now - cacheTime < 5000) {
        if (filePath === CONFIG_FILE && configCache !== null) {
            return configCache;
        }
        if (filePath === USERS_FILE && usersCache !== null) {
            return usersCache;
        }
    }
    
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(data);
            
            // 更新缓存
            if (filePath === CONFIG_FILE) {
                configCache = parsed;
            } else if (filePath === USERS_FILE) {
                usersCache = parsed;
            }
            cacheTime = now;
            
            return parsed;
        }
    } catch (e) {
        console.error(`读取文件失败: ${filePath}`, e.message);
    }
    return null;
}

// 写入JSON文件
function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        // 清除缓存
        if (filePath === CONFIG_FILE) {
            configCache = null;
        } else if (filePath === USERS_FILE) {
            usersCache = null;
        }
        cacheTime = 0;
        
        return true;
    } catch (e) {
        console.error(`写入文件失败: ${filePath}`, e.message);
        return false;
    }
}

// 初始化默认数据
function initData() {
    if (!fs.existsSync(CONFIG_FILE)) {
        const defaultConfig = {
            class_name: "初一7班",
            students: [],
            logs: [],
            quick_actions: {
                rewards: [
                    {text: "+1 表现良好", points: 1, reason: "表现良好"},
                    {text: "+2 积极发言", points: 2, reason: "积极发言"},
                    {text: "+3 作业优秀", points: 3, reason: "作业优秀"},
                    {text: "+5 重大贡献", points: 5, reason: "重大贡献"}
                ],
                punishments: [
                    {text: "-1 小失误", points: -1, reason: "小失误"},
                    {text: "-2 未交作业", points: -2, reason: "未交作业"},
                    {text: "-3 课堂违纪", points: -3, reason: "课堂违纪"}
                ]
            }
        };
        writeJSON(CONFIG_FILE, defaultConfig);
    }
    
    if (!fs.existsSync(USERS_FILE)) {
        const defaultUsers = [
            { username: 'teacher', password: 'teacher123', role: 'teacher', created: new Date().toISOString() }
        ];
        writeJSON(USERS_FILE, defaultUsers);
    }
}

// 初始化数据
initData();

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 路由处理
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    // SSE 连接（用于推送更新）
    if (pathname === '/api/sse') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        
        // 添加客户端
        clients.add(res);
        
        // 发送连接成功消息
        res.write('event: connected\ndata: {"status": "connected"}\n\n');
        
        // 客户端断开时移除
        req.on('close', () => {
            clients.delete(res);
        });
        
        return;
    }
    
    // 返回静态文件（带缓存控制）
    const staticFiles = {
        '/': 'index.html',
        '/index.html': 'index.html',
        '/admin.html': 'admin.html',
        '/login.html': 'login.html',
        '/teacher-login.html': 'teacher-login.html',
        '/student-admin.html': 'student-admin.html',
        '/sse-client.js': 'sse-client.js'
    };
    
    if (staticFiles[pathname]) {
        const filePath = path.join(__dirname, staticFiles[pathname]);
        res.writeHead(200, { 
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        fs.createReadStream(filePath).pipe(res);
        return;
    }
    
    // 读取配置（每次都从文件读取）
    if (pathname === '/api/config' && req.method === 'GET') {
        const config = readJSON(CONFIG_FILE, false); // 不使用缓存
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(config));
        return;
    }
    
    // 更新配置
    if (pathname === '/api/config' && req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const config = JSON.parse(body);
                if (writeJSON(CONFIG_FILE, config)) {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true }));
                    
                    // 推送更新给所有连接的客户端
                    broadcastUpdate('config');
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: false, error: '写入失败' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: 'JSON解析失败' }));
            }
        });
        return;
    }
    
    // 读取用户列表
    if (pathname === '/api/users' && req.method === 'GET') {
        const users = readJSON(USERS_FILE, false) || [];
        const safeUsers = users.map(u => ({
            username: u.username,
            role: u.role,
            created: u.created
        }));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(safeUsers));
        return;
    }
    
    // 创建用户
    if (pathname === '/api/users' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const users = readJSON(USERS_FILE, false) || [];
                const newUser = JSON.parse(body);
                
                if (users.find(u => u.username === newUser.username)) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: false, error: '用户名已存在' }));
                    return;
                }
                
                newUser.created = new Date().toISOString();
                users.push(newUser);
                
                if (writeJSON(USERS_FILE, users)) {
                    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true }));
                    broadcastUpdate('users');
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: false, error: '写入失败' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: 'JSON解析失败' }));
            }
        });
        return;
    }
    
    // 登录
    if (pathname === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const users = readJSON(USERS_FILE, false) || [];
                const { username, password } = JSON.parse(body);
                
                const user = users.find(u => u.username === username && u.password === password);
                
                if (user) {
                    const { password: _, ...safeUser } = user;
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, user: safeUser }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: false, error: '用户名或密码错误' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: 'JSON解析失败' }));
            }
        });
        return;
    }
    
    // 删除用户
    if (pathname.startsWith('/api/users/') && req.method === 'DELETE') {
        const username = pathname.split('/').pop();
        let users = readJSON(USERS_FILE, false) || [];
        users = users.filter(u => u.username !== username);
        
        if (writeJSON(USERS_FILE, users)) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true }));
            broadcastUpdate('users');
        } else {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: '写入失败' }));
        }
        return;
    }
    
    // 更新用户
    if (pathname.startsWith('/api/users/') && req.method === 'PUT') {
        const username = pathname.split('/').pop();
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const users = readJSON(USERS_FILE, false) || [];
                const userIndex = users.findIndex(u => u.username === username);
                
                if (userIndex === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: false, error: '用户不存在' }));
                    return;
                }
                
                const updatedUser = JSON.parse(body);
                users[userIndex] = { ...users[userIndex], ...updatedUser };
                
                if (writeJSON(USERS_FILE, users)) {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true }));
                    broadcastUpdate('users');
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: false, error: '写入失败' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: 'JSON解析失败' }));
            }
        });
        return;
    }
    
    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
});

// 广播更新给所有连接的客户端
function broadcastUpdate(type) {
    const message = `event: update\ndata: {"type": "${type}", "timestamp": ${Date.now()}}\n\n`;
    for (const client of clients) {
        try {
            client.write(message);
        } catch (e) {
            clients.delete(client);
        }
    }
}

// 使用 chokidar 监听文件变化
try {
    const watcher = chokidar.watch([CONFIG_FILE, USERS_FILE], {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100
        }
    });
    
    watcher.on('change', (filePath) => {
        console.log(`[文件变化] ${path.basename(filePath)} 已修改`);
        
        // 清除缓存
        if (filePath === CONFIG_FILE) {
            configCache = null;
        } else if (filePath === USERS_FILE) {
            usersCache = null;
        }
        
        // 广播更新
        broadcastUpdate(path.basename(filePath) === 'config.json' ? 'config' : 'users');
    });
    
    watcher.on('error', (error) => {
        console.error(`[文件监听错误] ${error.message}`);
    });
    
    console.log('[文件监听] 已启动，修改 data/ 目录下的文件会自动更新页面');
} catch (e) {
    console.log('[提示] chokidar 未安装，使用简单轮询方式监听文件');
    
    // 回退到简单轮询
    let lastConfigTime = 0;
    let lastUsersTime = 0;
    
    setInterval(() => {
        try {
            const configStat = fs.statSync(CONFIG_FILE);
            const usersStat = fs.statSync(USERS_FILE);
            
            if (configStat.mtimeMs !== lastConfigTime) {
                lastConfigTime = configStat.mtimeMs;
                configCache = null;
                broadcastUpdate('config');
                console.log('[文件变化] config.json 已修改');
            }
            
            if (usersStat.mtimeMs !== lastUsersTime) {
                lastUsersTime = usersStat.mtimeMs;
                usersCache = null;
                broadcastUpdate('users');
                console.log('[文件变化] users.json 已修改');
            }
        } catch (e) {
            // 忽略错误
        }
    }, 1000); // 每秒检查一次
}

// 启动服务器
server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  智慧班级管理系统 - 服务器已启动`);
    console.log(`========================================`);
    console.log(`  前台地址: http://localhost:${PORT}/`);
    console.log(`  教师后台: http://localhost:${PORT}/admin.html`);
    console.log(`  学生登录: http://localhost:${PORT}/login.html`);
    console.log(`  教师登录: http://localhost:${PORT}/teacher-login.html`);
    console.log(`========================================`);
    console.log(`  默认教师账号: teacher / teacher123`);
    console.log(`  数据文件: data/config.json`);
    console.log(`========================================`);
    console.log(`[提示] 修改 data/config.json 后，页面会自动刷新！`);
});

// 处理错误
server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用，请关闭其他程序或修改端口`);
    } else {
        console.error('服务器错误:', e.message);
    }
    process.exit(1);
});
