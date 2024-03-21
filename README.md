# 115下载请求转发
项目可以部署在Linux服务器上  
替代用户向115发起离线下载的请求，支持指定目录，支持为目录添加密码  
**建议配合[Alist](https://alist.nn.ci/zh/)项目使用**，实现用户隔离访问的同时，为每个用户提供离线下载的功能  
项目已经实现：
- 提供输入合法性校验
- 密码尝试次数过多锁定用户ip
- 下载链接忽略多余的换行和空格

## 环境依赖
- NodeJS 环境 [https://nodejs.org/en/download](https://nodejs.org/en/download)
- npm包 express (npm install express)
- npm包 node-fetch (npm install node-fetch)
- 115的用户Cookie (形如 **CID=123;SEID=456;UID=789** 抓包获得,建议抓取app的cookie,有效期更长.  
iOS可以使用Stream:下载后安装证书，点击开始抓包，切换到115点开任意视频文件，出现视频画面即可返回Stream,查看115.com的包内容,找到CID UID SEID)

## 使用  
### 建立文件夹，安装nodejs，npm依赖包
```bash
yum install nodejs
mkdir 115downloadRequest
cd 115downloadRequest  #进入文件夹后再安装npm包，否则npm包会装在外层目录
npm install express
npm install node-fetch
```
并下载 server.js/index.html/user.txt/run.sh到115downloadRequest  
### 修改user.txt
```
user1/22222222/password1
```
格式为：**用户名/目录id/密码**,每行一个  
获取目录id：登录网页版115，进入目录，地址栏cid后面的19位数字
### 修改index.html
```html 
<option value="22222222">user1</option>
```
为每个用户添加选择框，**vaule改为相应的用户目录id，user1改为用户名**
### 修改server.js
```javascript
'Cookie': 'CID=123;SEID=456;UID=789',
```
CID，SEID，UID改为自己抓取的cookie
### 修改run.sh
```shell
nohup node /opt/listenRequest/server.js > /opt/listenRequest/log.log 2>&1 &
```
/opt/listenRequest/server.js 改为**真实的绝对路径**  
/opt/listenRequest/log.log 改为**日志文件的绝对路径**
### 运行
```bash
./run.sh
```
### 测试访问
浏览器访问，http://localhost:3000 或 http://公网IP:3000 服务器默认运行在3000端口，使用http协议  
修改端口在server.js,把默认的3000修改即可
```javascript
server.listen(3000, () => {
    console.log(new Date().toString() + ':服务器启动,开始监听HTTP端口3000');
});
```
