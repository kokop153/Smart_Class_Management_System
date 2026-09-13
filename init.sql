-- D1 数据库初始化脚本
-- 创建 config 表和 users 表

-- 配置表（存储班级数据）
CREATE TABLE IF NOT EXISTS config (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户表（存储登录账号）
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置（初一7班49名学生）
INSERT OR IGNORE INTO config (id, data) VALUES ('main', '{
  "class_name": "初一7班",
  "students": [
    {"id": 1, "name": "潘奕萌", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 2, "name": "林承希", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 3, "name": "张浩轩", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 4, "name": "石徐骏", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 5, "name": "李瑾萱", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 6, "name": "陈琰", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 7, "name": "吴锶乐", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 8, "name": "苏哲靖", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 9, "name": "曾俊哲", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 10, "name": "李嘉翔", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 11, "name": "许梓轩", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 12, "name": "罗心怡", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 13, "name": "罗思涵", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 14, "name": "杨辰兮", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 15, "name": "刘鸿凌", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 16, "name": "陈羽菲", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 17, "name": "张煜晨", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 18, "name": "管芯语", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 19, "name": "梁皓然", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 20, "name": "林德玺", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 21, "name": "马佳慧", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 22, "name": "王宏睿", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 23, "name": "纪昊宇", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 24, "name": "邓渤轩", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 25, "name": "王诗琪", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 26, "name": "刘作齐", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 27, "name": "姜楚涵", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 28, "name": "吴紫萱", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 29, "name": "陈梵宇", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 30, "name": "钟堂烨", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 31, "name": "郭腾宇", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 32, "name": "陈艺莹", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 33, "name": "杨祺文", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 34, "name": "张子扬", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 35, "name": "刘梦涵", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 36, "name": "李辉华", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 37, "name": "邓璇", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 38, "name": "陈宣润", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 39, "name": "陈彧萱", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 40, "name": "邱海群", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 41, "name": "王思远", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 42, "name": "黄文菁", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 43, "name": "陈雨欣", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 44, "name": "管子郗", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 45, "name": "吴金屿", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 46, "name": "陈恩齐", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 47, "name": "罗杰", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 48, "name": "涂治平", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false},
    {"id": 49, "name": "胡存兴", "student_id": "", "score": 0, "positive_count": 0, "negative_count": 0, "is_admin": false}
  ],
  "logs": [],
  "quick_actions": {
    "rewards": [
      {"text": "+1 表现良好", "points": 1, "reason": "表现良好"},
      {"text": "+2 积极发言", "points": 2, "reason": "积极发言"},
      {"text": "+3 作业优秀", "points": 3, "reason": "作业优秀"},
      {"text": "+5 重大贡献", "points": 5, "reason": "重大贡献"}
    ],
    "punishments": [
      {"text": "-1 小失误", "points": -1, "reason": "小失误"},
      {"text": "-2 未交作业", "points": -2, "reason": "未交作业"},
      {"text": "-3 课堂违纪", "points": -3, "reason": "课堂违纪"}
    ]
  }
}');

-- 插入默认教师账号
INSERT OR IGNORE INTO users (username, password, role) VALUES ('teacher', 'teacher123', 'teacher');
