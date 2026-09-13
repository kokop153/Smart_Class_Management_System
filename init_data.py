import json
from datetime import datetime

# 创建数据目录
import os
if not os.path.exists('data'):
    os.makedirs('data')

# 初始化配置文件
config_path = 'data/config.json'
if not os.path.exists(config_path):
    config = {
        "class_name": "初一7班",
        "students": [],
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
    }
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    print('[成功] 配置文件已创建')

# 初始化用户文件
users_path = 'data/users.json'
if not os.path.exists(users_path):
    users = [
        {"username": "teacher", "password": "teacher123", "role": "teacher", "created": datetime.now().isoformat()}
    ]
    with open(users_path, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)
    print('[成功] 用户数据已创建')

print('[信息] 数据初始化完成')
