# 智慧班级管理系统

一个基于 Web 的班级管理系统，支持学生积分管理、奖惩操作、排行榜统计等功能。

## 📋 功能特点

### 教师端 (admin.html)
- 👥 **学生管理** - 添加/编辑/删除学生信息
- 📝 **加减分操作** - 快捷奖励/惩罚按钮 + 自定义加减分
- 🏆 **排行榜** - 自动排序显示学生积分排名
- 📋 **操作日志** - 记录所有加减分操作
- ⚙️ **高级配置** - 直接编辑 JSON 配置数据
- 💾 **数据管理** - 导出/导入 JSON/CSV 数据
- 🎲 **随机抽取** - 随机抽取学生回答问题

### 学生端 (index.html)
- 🏠 **首页概览** - 查看班级统计和学生列表
- 🏆 **排行榜** - 查看班级积分排名
- 📋 **操作日志** - 查看操作记录
- 👤 **我的档案** - 查看个人积分和奖惩次数
- 📝 **加减分操作** - 仅管理员可用

### 权限管理
- **教师** - 完全管理权限
- **学生管理员** - 可对学生进行加减分操作
- **普通学生** - 仅查看数据

## 🚀 快速开始

### 方法一：双击启动（推荐）
```bash
双击 start.bat
```

### 方法二：命令行启动
```bash
# 1. 创建虚拟环境
python -m venv venv

# 2. 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. 安装依赖
pip install -r requirements.txt

# 4. 初始化数据
python init_data.py

# 5. 启动服务器
python app.py
```

## 🔗 访问地址

| 页面 | 地址 | 说明 |
|------|------|------|
| 前台首页 | http://localhost:8080/ | 学生可查看 |
| 教师后台 | http://localhost:8080/admin.html | 教师管理 |
| 学生登录 | http://localhost:8080/login.html | 学生注册/登录 |
| 教师登录 | http://localhost:8080/teacher-login.html | 教师登录 |
| 学生管理员 | http://localhost:8080/student-admin.html | 学生管理员后台 |

## 🔐 默认账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 教师 | teacher | teacher123 | 初始管理员账号 |

## 📁 文件结构

```
work/
├── app.py                 # Flask 服务器主程序
├── init_data.py           # 数据初始化脚本
├── start.bat             # 一键启动脚本
├── requirements.txt      # Python 依赖
├── README.md             # 使用说明
├── index.html            # 前台页面（学生端）
├── admin.html            # 教师管理后台
├── login.html            # 学生登录/注册页
├── teacher-login.html    # 教师登录页
├── student-admin.html    # 学生管理员后台
├── sse-client.js         # SSE 实时推送客户端
└── data/
    ├── config.json       # 班级配置（学生名单、积分等）
    └── users.json        # 用户账号数据
```

## 📊 数据说明

### 配置文件 (data/config.json)
```json
{
  "class_name": "班级名称",
  "students": [
    {
      "id": 1,
      "name": "学生姓名",
      "student_id": "学号",
      "score": 0,
      "positive_count": 0,
      "negative_count": 0,
      "is_admin": false
    }
  ],
  "logs": [],
  "quick_actions": {
    "rewards": [...],
    "punishments": [...]
  }
}
```

### 用户文件 (data/users.json)
```json
[
  {
    "username": "用户名",
    "password": "密码",
    "role": "teacher/student/admin",
    "created": "创建时间"
  }
]
```

## ✨ 使用方法

### 添加学生
1. 教师登录后台 http://localhost:8080/teacher-login.html
2. 进入"学生管理"页面
3. 输入学生姓名和学号
4. 点击"添加学生"

### 授予学生管理员权限
1. 在学生管理列表中找到学生
2. 点击"授予"按钮
3. 该学生登录后可以进入学生管理员后台进行加减分操作

### 加减分操作
1. 进入"加减分操作"页面
2. 选择学生
3. 点击快捷按钮或输入自定义分数
4. 系统自动记录操作日志

### 随机抽取学生
1. 进入"随机抽取"页面
2. 点击"开始抽取"按钮
3. 点击"停止"按钮
4. 显示抽中的学生

### 导出数据
1. 进入"数据管理"页面
2. 选择导出格式（JSON/CSV）
3. 点击"导出文件"

### 导入数据
1. 编辑 `data/config.json` 文件
2. 或使用"高级配置"页面直接编辑 JSON
3. 点击"应用配置"

## 🔧 技术栈

- **后端**: Python 3.8+ / Flask
- **前端**: HTML5 / CSS3 / JavaScript
- **数据存储**: JSON 文件
- **实时通信**: Server-Sent Events (SSE)

## 📦 依赖安装

```bash
pip install -r requirements.txt
```

依赖包：
- Flask==3.0.0
- flask-cors==4.0.0
- watchdog==3.0.0

## ⚠️ 注意事项

1. **首次运行**会自动创建数据目录和配置文件
2. **数据持久化**：所有数据保存在 `data/` 目录下
3. **自动刷新**：修改 `data/config.json` 后页面会自动刷新
4. **安全提示**：本系统仅供局域网内使用，建议不要在公网暴露

## 🐛 常见问题

### Q: 端口被占用怎么办？
A: 修改 `app.py` 中的 `PORT` 变量，或关闭占用 8080 端口的程序。

### Q: 如何修改教师密码？
A: 编辑 `data/users.json` 文件，修改 `password` 字段。

### Q: 数据保存在哪里？
A: 数据保存在 `data/` 目录下，可直接编辑 JSON 文件。

### Q: 如何备份数据？
A: 复制 `data/` 目录即可。

### Q: 如何恢复数据？
A: 将备份的 `data/` 目录复制回去即可。

## 📝 更新日志

### v1.0.0 (2026-09-13)
- ✅ 初始版本发布
- ✅ Flask 服务器
- ✅ 实时自动刷新
- ✅ 权限管理（教师/学生管理员/普通学生）
- ✅ 数据持久化
- ✅ 导入/导出功能
- ✅ 随机抽取功能

## 📄 许可证

MIT License

## 👥 作者

智慧班级管理系统

---

**使用说明：**
1. 双击 `start.bat` 启动服务器
2. 访问 http://localhost:8080/teacher-login.html 登录教师账号
3. 首次使用请先导入班级配置文件或手动添加学生
4. 修改 `data/config.json` 后页面会自动刷新

**技术支持：** 如有问题请检查控制台输出或查看 README.md
