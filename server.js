const https = require('https');
const fs = require('fs');

const ipAttempts = {};  //记录登陆失败的ip
const lockDuration = 60 * 60 * 1000; //锁定1小时，1000毫秒*60*60
const maxAttempts = 5;  //最大尝试次数5次
let users = [];

// 读取 SSL 证书和密钥
const options = {
  key: fs.readFileSync('/path/to/your/key.key'),
  cert: fs.readFileSync('/path/to/your/cret.crt'),
};

// 读取用户信息文件，并保存到全局变量中
fs.readFile('user.txt', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading user file:', err);
        return;
    }
    users = data.trim().split('\r\n').map(line => {
        const [username, pathId, password] = line.split('/');
        return { username, pathId, password };
    });
});

//记录登陆失败的ip
function recordFailedAttempt(ip) {
    if (!ipAttempts[ip]) {
        ipAttempts[ip] = {
            attempts: 1,
            lockedUntil: null
        };
    } else {
        ipAttempts[ip].attempts++;
    }
}

// 清理过期锁定的IP
function cleanExpiredLocks() {
    const now = Date.now();
    for (const ip in ipAttempts) {
        if (ipAttempts[ip].lockedUntil && ipAttempts[ip].lockedUntil < now) {
            delete ipAttempts[ip];
        }
    }
}

function isIpLocked(ip) {
    cleanExpiredLocks(); // 清理过期锁定的IP
    const attempt = ipAttempts[ip];
    if (!attempt) {
        return false;
    }
    if (attempt.lockedUntil && attempt.lockedUntil > Date.now()) {
        return true;
    }
    return false;
}
//锁定尝试过多的ip
function lockIp(ip) {
    console.log(new Date().toString() + ':IP已被锁定,' + ip.toString());
    ipAttempts[ip].lockedUntil = Date.now() + lockDuration;
}

const server = https.createServer(options,(req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        // 返回包含输入文本框和选择框的HTML表单
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream('index.html').pipe(res);
    } else if (req.method === 'POST' && req.url === '/') {
        // 处理用户提交的表单数据
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const formData = new URLSearchParams(body);
            const userInput = {
                magnetLink: formData.get('magnetLink'),
                pathId: formData.get('pathId'),
                password: formData.get('password'),
            };

            const ip = req.socket.remoteAddress;
            console.log(new Date().toString() + ':用户IP地址,' + ip.toString() + ',用户输入:', userInput);

            //ip被锁定，直接return，不进行后续流程
            if (isIpLocked(ip)) {
                res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('IP地址已被锁定，请耐心等待，或联系管理员');
                return;
            }

            //下载链接为空
            if (userInput.magnetLink == '') {
                res.writeHead(400, { 'Content-Type': 'text/html ; charset=utf-8' });
                res.end('下载链接为空，请输入有效的下载链接');
                return;
            }

            //未选择有效目录
            if (userInput.pathId == null) {
                res.writeHead(400, { 'Content-Type': 'text/html ; charset=utf-8' });
                res.end('请选择有效的用户目录');
                return;
            }

            const user = users.find(u => u.pathId === userInput.pathId.toString() && u.password === userInput.password.toString());
            //登陆失败
            if (!user) {
                console.log(new Date().toString() + ':用户IP地址,' + ip.toString() + ',密码校验失败');
                recordFailedAttempt(ip);
                if (ipAttempts[ip].attempts >= maxAttempts) {
                    lockIp(ip);
                    res.writeHead(403, { 'Content-Type': 'text/html ; charset=utf-8' });
                    res.end('IP地址已被锁定，请耐心等待，或联系管理员');
                    return;
                }
                res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('密码错误,请重试,失败5次将锁定IP');
                return;
            }

            const url = 'http://115.com/web/lixian/';
            const params = new URLSearchParams();
            params.append('ct', 'lixian');
            params.append('wp_path_id', userInput.pathId.toString());

            let magStr = userInput.magnetLink;
            urlArr = magStr.split(/\r?\n/);
            urlArr = urlArr.filter(item => item !== '');
            urlArr = urlArr.map(str => str.trim());
            console.log(new Date().toString() + ':过滤后的任务URL,', urlArr);

            if (urlArr.length == 1) { //1个链接的话调用 add_task_url + url
                params.append('url', urlArr[0]);
                params.append('ac', 'add_task_url');
            } else {  //多个任务调用  add_task_urls + url[0] url[1] ...
                params.append('ac', 'add_task_urls');
                for (let i = 0; i < urlArr.length; ++i) {

                    params.append('url[' + i.toString() + ']', urlArr[i]);
                }
            }

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': 'CID=123;SEID=456;UID=789',
                },
                body: params.toString(),
            };

            import('node-fetch')
                .then(({ default: fetch }) => {
                    // 向115.com发起请求
                    fetch(url, options)
                        .then(response => response.text())
                        .then(result => {
                            // 将115.com的响应返回给前端
                            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                            console.log(new Date().toString() + ':115的响应,' + result);
                            res.end(result);
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end('Internal Server Error');
                        });
                })
                .catch(error => console.error('Error:', error));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('404 Not Found/请求的资源不存在.');
    }
});

server.listen(3000, () => {
    console.log(new Date().toString() + ':服务器启动,开始监听HTTPS端口3000');
});
