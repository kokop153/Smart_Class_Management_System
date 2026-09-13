// 添加 SSE 自动刷新功能
(function() {
    // 检查是否是管理页面
    const isAdminPage = window.location.pathname.includes('admin.html') || 
                        window.location.pathname.includes('student-admin.html');
    
    if (isAdminPage) {
        connectSSE();
    }
    
    function connectSSE() {
        const eventSource = new EventSource('/api/sse');
        
        eventSource.addEventListener('connected', function(e) {
            console.log('[SSE] 已连接到服务器');
        });
        
        eventSource.addEventListener('update', function(e) {
            const data = JSON.parse(e.data);
            console.log('[SSE] 收到更新:', data.type);
            
            // 根据更新类型刷新页面
            if (data.type === 'config') {
                // 重新加载配置
                fetch('/api/config', { cache: 'no-store' })
                    .then(response => response.json())
                    .then(config => {
                        window.config = config;
                        localStorage.setItem('classConfig', JSON.stringify(config));
                        // 重新渲染页面
                        if (typeof renderAll === 'function') {
                            renderAll();
                        }
                        showToast('数据已自动更新！');
                    })
                    .catch(err => console.error('加载配置失败:', err));
            } else if (data.type === 'users') {
                // 用户数据更新，刷新页面
                location.reload();
            }
        });
        
        eventSource.onerror = function(e) {
            console.log('[SSE] 连接错误，3秒后重连...');
            // 3秒后尝试重连
            setTimeout(() => {
                eventSource.close();
                connectSSE();
            }, 3000);
        };
        
        // 页面关闭时关闭连接
        window.addEventListener('beforeunload', function() {
            eventSource.close();
        });
    }
    
    // 简单的提示函数
    function showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
})();
