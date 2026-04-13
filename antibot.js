/**
 * 反爬虫防护系统
 * 多层检测机制，有效阻止AI爬虫、自动化工具和恶意爬虫
 */

(function() {
    'use strict';

    // 配置项
    const CONFIG = {
        enableUserAgentCheck: true,
        enableHeadlessCheck: true,
        enableAutomationCheck: true,
        enableFingerprintCheck: true,
        enableBehaviorCheck: true,
        enableHoneypot: true,
        enableContentProtection: true,
        blockAction: 'redirect', // 'redirect', 'blank', 'message', 'captcha'
        blockUrl: 'about:blank',
        debug: false
    };

    // 蜜罐链接检测 - 爬虫通常会访问CSS隐藏的链接
    function checkHoneypot() {
        if (!CONFIG.enableHoneypot) return false;

        const honeypot = document.querySelector('.antibot-honeypot');
        if (honeypot && honeypot.checked) {
            log('蜜罐触发：检测到爬虫行为');
            blockAccess();
            return true;
        }
        return false;
    }

    // User-Agent检测
    function checkUserAgent() {
        if (!CONFIG.enableUserAgentCheck) return false;

        const ua = navigator.userAgent.toLowerCase();

        // 常见爬虫和自动化工具的UA模式
        const botPatterns = [
            // AI爬虫
            /chatgpt-/,
            /gptbot/,
            /ccbot/,
            /google-extended/,
            /anthropic-ai/,
            /claude-/,
            /perplexity/,
            /youbot/,
            /bytespider/,
            /dataforseobot/,
            /amazonbot/,
            /applebot/,
            /omgili/,
            /facebookbot/,
            /googleother/,
            /googlebot/,
            /bingbot/,
            /slurp/,
            /duckduckbot/,
            /baiduspider/,
            /sogou/,
            /yandexbot/,
            /linkedinbot/,
            /twitterbot/,

            // 自动化工具
            /headlesschrome/,
            /phantomjs/,
            /selenium/,
            /webdriver/,
            /puppeteer/,
            /playwright/,
            /casperjs/,
            /zombie/,

            // HTTP库
            /python-requests/,
            /python-urllib/,
            /guzzlehttp/,
            /java/,
            /curl/,
            /wget/,
            /fetch/,
            /axios/,
            /node-fetch/,
            /http\.js/,
            /http-client/,
            /superagent/,
            /got/,

            // 爬虫框架
            /scrapy/,
            /crawler/,
            /spider/,
            /scraper/,

            // 无头浏览器
            /headless/,
            /electron/,

            // 其他可疑模式
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /crawl/i,
            /spider/i
        ];

        for (const pattern of botPatterns) {
            if (pattern.test(ua)) {
                log(`User-Agent检测失败：匹配到模式 ${pattern}`);
                blockAccess();
                return true;
            }
        }

        return false;
    }

    // 无头浏览器检测
    function checkHeadlessBrowser() {
        if (!CONFIG.enableHeadlessCheck) return false;

        let isHeadless = false;

        // 检测1：navigator.webdriver（被Selenium等工具设置为true）
        if (navigator.webdriver) {
            log('无头浏览器检测：navigator.webdriver = true');
            isHeadless = true;
        }

        // 检测2：检查Chrome DevTools Protocol
        if (window.chrome && window.chrome.runtime && window.chrome.runtime.id) {
            log('无头浏览器检测：检测到CDP扩展');
            isHeadless = true;
        }

        // 检测3：检查window对象中的自动化标记
        if (window._Selenium_IDE_Recorder || window.callSelenium || window.$cdc_asdjflasutopfhvcZLmcfl_) {
            log('无头浏览器检测：检测到Selenium标记');
            isHeadless = true;
        }

        // 检测4：检查window.navigator中的可疑属性
        const suspiciousProps = ['__webdriver_evaluate', '__selenium_evaluate', '__webdriver_script_function', '__webdriver_script_func', '__webdriver_script_fn', '_fxdriver_evaluate', '_driver_evaluate', '__webdriver_unwrapped', '__driver_unwrapped', '__fxdriver_unwrapped', '_Selenium_IDE_Recorder', '__selenium_unwrapped', '__webdriver_script_fun', '__lastWatirAlert', '__lastWatirConfirm', '__lastWatirPrompt', '__webdriver_elem_warn', '__webDriverArguments', '__lastWatirTargetWindow'];

        for (const prop of suspiciousProps) {
            if (window[prop]) {
                log(`无头浏览器检测：检测到属性 ${prop}`);
                isHeadless = true;
            }
        }

        // 检测5：检查window.external
        if (window.external && window.external.toString() && window.external.toString().indexOf('Sequentum') !== -1) {
            log('无头浏览器检测：检测到Sequentum爬虫');
            isHeadless = true;
        }

        // 检测6：检查document.documentElement的属性
        const documentProps = ['webdriver', '__selenium_unwrapped', '__driver_unwrapped'];
        for (const prop of documentProps) {
            if (document.documentElement && document.documentElement.getAttribute(prop)) {
                log(`无头浏览器检测：检测到document属性 ${prop}`);
                isHeadless = true;
            }
        }

        // 检测7：检查navigator.plugins（无头浏览器通常插件数量很少）
        if (navigator.plugins && navigator.plugins.length < 3) {
            log(`无头浏览器检测：插件数量异常 (${navigator.plugins.length})`);
            isHeadless = true;
        }

        // 检测8：检查navigator.languages
        if (navigator.languages && navigator.languages.length === 0) {
            log('无头浏览器检测：navigator.languages为空');
            isHeadless = true;
        }

        // 检测9：检查屏幕信息（无头浏览器通常返回默认值）
        if (window.screen && window.screen.width === 0 && window.screen.height === 0) {
            log('无头浏览器检测：屏幕尺寸为0');
            isHeadless = true;
        }

        if (isHeadless) {
            blockAccess();
            return true;
        }

        return false;
    }

    // 自动化工具检测
    function checkAutomationTools() {
        if (!CONFIG.enableAutomationCheck) return false;

        let isAutomation = false;

        // 检测1：检查window.callPhantom和window._phantom
        if (window.callPhantom || window._phantom) {
            log('自动化检测：检测到PhantomJS');
            isAutomation = true;
        }

        // 检测2：检查window.Buffer
        if (typeof Buffer !== 'undefined') {
            log('自动化检测：检测到Node.js环境');
            isAutomation = true;
        }

        // 检测3：检查process对象（Node.js）
        if (typeof process !== 'undefined') {
            log('自动化检测：检测到process对象');
            isAutomation = true;
        }

        // 检测4：检查global对象
        if (typeof global !== 'undefined') {
            log('自动化检测：检测到global对象');
            isAutomation = true;
        }

        // 检测5：检查__proto__劫持
        try {
            const desc = Object.getOwnPropertyDescriptor(navigator, 'webdriver');
            if (desc && !desc.configurable && !desc.enumerable && desc.get) {
                log('自动化检测：webdriver属性被锁定');
                isAutomation = true;
            }
        } catch (e) {
            // 忽略错误
        }

        if (isAutomation) {
            blockAccess();
            return true;
        }

        return false;
    }

    // 浏览器指纹检测
    function checkBrowserFingerprint() {
        if (!CONFIG.enableFingerprintCheck) return false;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            log('浏览器指纹：无法获取Canvas上下文');
            blockAccess();
            return true;
        }

        // 绘制一个简单的图像
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Hello, visitor!', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Hello, visitor!', 4, 17);

        // 获取Canvas数据URL
        const dataURL = canvas.toDataURL();

        // 如果返回空字符串或固定值，可能是自动化环境
        if (!dataURL || dataURL === 'data:,') {
            log('浏览器指纹：Canvas数据为空');
            blockAccess();
            return true;
        }

        // 检测WebGL
        const gl = document.createElement('canvas').getContext('webgl');
        if (!gl) {
            log('浏览器指纹：不支持WebGL（可能是无头浏览器）');
            blockAccess();
            return true;
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (renderer && (renderer.includes('SwiftShader') || renderer.includes('Angle') || renderer.includes('Mesa'))) {
                log(`浏览器指纹：检测到可疑渲染器 - ${renderer}`);
                blockAccess();
                return true;
            }
        }

        return false;
    }

    // 行为检测
    function checkBehavior() {
        if (!CONFIG.enableBehaviorCheck) return false;

        let isSuspicious = false;

        // 检测1：页面加载时间过快（爬虫通常没有渲染延迟）
        const loadTime = performance.now();
        if (loadTime < 10) {
            log(`行为检测：页面加载时间异常 (${loadTime}ms)`);
            isSuspicious = true;
        }

        // 检测2：鼠标移动次数（真实用户会移动鼠标）
        let mouseMoveCount = 0;
        let clickCount = 0;
        let scrollCount = 0;
        let keyPressCount = 0;

        document.addEventListener('mousemove', () => {
            mouseMoveCount++;
        });

        document.addEventListener('click', () => {
            clickCount++;
        });

        document.addEventListener('scroll', () => {
            scrollCount++;
        });

        document.addEventListener('keypress', () => {
            keyPressCount++;
        });

        // 5秒后检查用户行为
        setTimeout(() => {
            if (mouseMoveCount < 2 && clickCount === 0 && scrollCount === 0 && keyPressCount === 0) {
                log(`行为检测：未检测到用户交互 (鼠标:${mouseMoveCount}, 点击:${clickCount}, 滚动:${scrollCount}, 按键:${keyPressCount})`);
                blockAccess();
            }
        }, 5000);

        if (isSuspicious) {
            blockAccess();
            return true;
        }

        return false;
    }

    // 阻止访问
    function blockAccess() {
        if (CONFIG.debug) {
            console.error('[反爬虫] 阻止访问');
            return;
        }

        switch (CONFIG.blockAction) {
            case 'redirect':
                window.location.href = CONFIG.blockUrl;
                break;
            case 'blank':
                document.body.innerHTML = '';
                break;
            case 'message':
                document.body.innerHTML = `
                    <div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial,sans-serif;">
                        <div style="text-align:center;">
                            <h2 style="color:#d9534f;">访问受限</h2>
                            <p style="color:#666;margin:20px 0;">我们检测到您的访问行为异常，可能使用了自动化工具。</p>
                            <p style="color:#666;">请使用正常浏览器访问本站。</p>
                        </div>
                    </div>
                `;
                break;
            case 'captcha':
                // 可以集成验证码服务
                showChallenge();
                break;
            default:
                window.location.href = CONFIG.blockUrl;
        }
    }

    // 显示挑战
    function showChallenge() {
        document.body.innerHTML = `
            <div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial,sans-serif;background:#f5f5f5;">
                <div style="background:white;padding:40px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);text-align:center;">
                    <h2 style="color:#333;margin-bottom:20px;">请验证您是人类</h2>
                    <p style="color:#666;margin-bottom:30px;">点击下方按钮继续访问</p>
                    <button id="challenge-btn" style="background:#007bff;color:white;border:none;padding:12px 30px;border-radius:4px;font-size:16px;cursor:pointer;">
                        我是人类
                    </button>
                </div>
            </div>
        `;

        document.getElementById('challenge-btn').addEventListener('click', function() {
            // 生成一个简单的token
            const token = btoa(Date.now() + '_' + Math.random().toString(36).substr(2));
            sessionStorage.setItem('antibot_token', token);
            location.reload();
        });
    }

    // 日志记录
    function log(message) {
        if (CONFIG.debug) {
            console.log(`[反爬虫] ${message}`);
        }
    }

    // 内容保护 - 将敏感内容通过JavaScript动态加载
    function protectContent() {
        if (!CONFIG.enableContentProtection) return;

        // 查找所有需要保护的内容
        const protectedElements = document.querySelectorAll('[data-protected]');

        protectedElements.forEach(element => {
            const encodedContent = element.getAttribute('data-protected');
            if (encodedContent) {
                // Base64解码
                try {
                    element.innerHTML = atob(encodedContent);
                    // 移除属性以防止重复解码
                    element.removeAttribute('data-protected');
                } catch (e) {
                    log('内容解码失败');
                }
            }
        });
    }

    // 添加蜜罐
    function addHoneypot() {
        if (!CONFIG.enableHoneypot) return;

        const honeypot = document.createElement('input');
        honeypot.type = 'checkbox';
        honeypot.className = 'antibot-honeypot';
        honeypot.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';
        honeypot.name = 'antibot_honeypot';
        honeypot.value = '1';
        honeypot.tabIndex = -1;
        honeypot.autocomplete = 'off';
        document.body.appendChild(honeypot);

        // 蜜罐链接
        const honeypotLink = document.createElement('a');
        honeypotLink.href = '/trap';
        honeypotLink.className = 'antibot-honeypot-link';
        honeypotLink.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';
        honeypotLink.textContent = 'trap';
        document.body.appendChild(honeypotLink);

        // 蜜pot表单
        const honeypotForm = document.createElement('form');
        honeypotForm.className = 'antibot-honeypot-form';
        honeypotForm.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';
        honeypotForm.innerHTML = `
            <input type="text" name="antibot_field" value="">
            <input type="email" name="antibot_email" value="">
        `;
        document.body.appendChild(honeypotForm);
    }

    // 防止内容选择和复制
    function preventCopy() {
        // 添加CSS防止选择
        const style = document.createElement('style');
        style.textContent = `
            body {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
        `;
        document.head.appendChild(style);

        // 禁用右键
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // 禁用F12和其他开发者工具快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.shiftKey && e.key === 'C') || (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                return false;
            }
        });
    }

    // 检查会话token
    function checkSessionToken() {
        const token = sessionStorage.getItem('antibot_token');
        if (!token) {
            // 如果没有token，添加行为检测
            checkBehavior();
        }
    }

    // 检测Referrer
    function checkReferrer() {
        const referrer = document.referrer;
        if (!referrer) {
            // 直接访问可能是爬虫
            // 但是正常用户也可能直接访问，所以这里只是记录
            log('直接访问（无Referer）');
        }
    }

    // 初始化
    function init() {
        log('反爬虫系统初始化');

        // 立即执行的检测
        if (checkUserAgent()) return;
        if (checkHeadlessBrowser()) return;
        if (checkAutomationTools()) return;
        if (checkHoneypot()) return;
        if (checkBrowserFingerprint()) return;

        // 添加保护措施
        addHoneypot();
        protectContent();
        checkSessionToken();
        checkReferrer();

        // 可选：启用防复制功能
        // preventCopy();

        log('反爬虫系统运行中');
    }

    // 当DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 暴露给全局（可选）
    window.AntiBot = {
        init: init,
        blockAccess: blockAccess,
        checkUserAgent: checkUserAgent,
        checkHeadlessBrowser: checkHeadlessBrowser,
        checkAutomationTools: checkAutomationTools
    };

})();
