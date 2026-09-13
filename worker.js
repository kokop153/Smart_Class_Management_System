// Cloudflare Workers 适配版 - 使用 D1 数据库存储数据
// 需要 Cloudflare 账号 + D1 数据库

const DATABASE_NAME = 'class-db';
const DB_TABLE = 'config';

// 初始化数据库表（首次运行时需要手动执行）
const INIT_SQL = `
  CREATE TABLE IF NOT EXISTS ${DB_TABLE} (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// 初始化默认数据
function getDefaultValue() {
  return {
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
}

const defaultUsers = [
  { username: 'teacher', password: 'teacher123', role: 'teacher' }
];

// Workers 配置
export default {
  async fetch(request, env, ctx) {
    // 设置 CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    try {
      // 路由处理
      if (pathname === '/' || pathname.endsWith('.html')) {
        // 静态文件
        return serveStatic(pathname, env);
      }
      
      // API 路由
      if (pathname === '/api/config' && request.method === 'GET') {
        const config = await getConfig(env);
        return jsonResponse(config, corsHeaders);
      }
      
      if (pathname === '/api/config' && request.method === 'PUT') {
        const body = await request.json();
        await saveConfig(env, body);
        return jsonResponse({ success: true }, corsHeaders);
      }
      
      if (pathname === '/api/users' && request.method === 'GET') {
        const users = await getUsers(env);
        return jsonResponse(users, corsHeaders);
      }
      
      if (pathname === '/api/users' && request.method === 'POST') {
        const body = await request.json();
        const result = await createUser(env, body);
        return jsonResponse(result, corsHeaders, result.success ? 201 : 400);
      }
      
      if (pathname === '/api/login' && request.method === 'POST') {
        const body = await request.json();
        const result = await login(env, body);
        return jsonResponse(result, corsHeaders, result.success ? 200 : 401);
      }
      
      if (pathname.startsWith('/api/users/') && request.method === 'DELETE') {
        const username = pathname.split('/').pop();
        const result = await deleteUser(env, username);
        return jsonResponse(result, corsHeaders);
      }
      
      if (pathname.startsWith('/api/users/') && request.method === 'PUT') {
        const username = pathname.split('/').pop();
        const body = await request.json();
        const result = await updateUser(env, username, body);
        return jsonResponse(result, corsHeaders);
      }
      
      // 404
      return jsonResponse({ error: 'Not Found' }, corsHeaders, 404);
      
    } catch (error) {
      console.error('Server error:', error);
      return jsonResponse({ error: error.message }, corsHeaders, 500);
    }
  }
};

// ========== 数据库操作 ==========

async function getConfig(env) {
  const db = env[DATABASE_NAME];
  const result = await db.prepare(`SELECT data FROM ${DB_TABLE} WHERE id = 'main' LIMIT 1`).first();
  
  if (result) {
    return JSON.parse(result.data);
  }
  
  // 如果没有数据，初始化默认值
  const defaultValue = getDefaultValue();
  await db.prepare(`INSERT INTO ${DB_TABLE} (id, data) VALUES ('main', ?)`)
    .bind(JSON.stringify(defaultValue))
    .run();
  
  // 初始化用户
  for (const user of defaultUsers) {
    await db.prepare(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`)
      .bind(user.username, user.password, user.role)
      .run();
  }
  
  return defaultValue;
}

async function saveConfig(env, config) {
  const db = env[DATABASE_NAME];
  await db.prepare(`INSERT INTO ${DB_TABLE} (id, data) VALUES ('main', ?) 
                    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`)
    .bind(JSON.stringify(config))
    .run();
}

async function getUsers(env) {
  const db = env[DATABASE_NAME];
  const result = await db.prepare(`SELECT username, role, created_at FROM users`).all();
  return result.results || [];
}

async function createUser(env, userData) {
  const db = env[DATABASE_NAME];
  
  // 检查用户名是否已存在
  const existing = await db.prepare(`SELECT username FROM users WHERE username = ?`).bind(userData.username).first();
  if (existing) {
    return { success: false, error: '用户名已存在' };
  }
  
  await db.prepare(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`)
    .bind(userData.username, userData.password, userData.role || 'student')
    .run();
  
  return { success: true };
}

async function login(env, credentials) {
  const db = env[DATABASE_NAME];
  const user = await db.prepare(`SELECT username, role FROM users WHERE username = ? AND password = ?`)
    .bind(credentials.username, credentials.password)
    .first();
  
  if (user) {
    return { success: true, user };
  }
  return { success: false, error: '用户名或密码错误' };
}

async function deleteUser(env, username) {
  const db = env[DATABASE_NAME];
  await db.prepare(`DELETE FROM users WHERE username = ?`).bind(username).run();
  return { success: true };
}

async function updateUser(env, username, userData) {
  const db = env[DATABASE_NAME];
  await db.prepare(`UPDATE users SET role = ?, password = ? WHERE username = ?`)
    .bind(userData.role, userData.password, username)
    .run();
  return { success: true };
}

// ========== 工具函数 ==========

function serveStatic(pathname, env) {
  // 简单的静态文件服务
  // 实际部署时需要将 HTML 文件放在同一目录
  const files = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/admin.html': 'admin.html',
    '/login.html': 'login.html',
    '/teacher-login.html': 'teacher-login.html',
    '/student-admin.html': 'student-admin.html'
  };
  
  const filename = files[pathname] || 'index.html';
  const content = env[filename] || '<h1>404 Not Found</h1>';
  
  return new Response(content, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...corsHeaders
    }
  });
}

function jsonResponse(data, headers, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    },
    status
  });
}

// 导出 CORS 头供其他文件使用
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
