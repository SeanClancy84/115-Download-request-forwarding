# 115 Download Request Forwarding
Project can be deployed on Linux servers  
Alternative users to 115 to initiate offline download requests, support for specifying directories, support for adding passwords to directories  
**It is recommended to use with [Alist](https://alist.nn.ci/zh/) project** to realize isolated user access while providing offline downloads for each user  
The project has been realized:
- Provide input legitimacy check
- Lock user's ip for too many password attempts
- Download links ignore extra line breaks and spaces.

## Environment dependencies
- NodeJS environment [https://nodejs.org/en/download](https://nodejs.org/en/download)
- npm package **express** (npm install express)
- npm package **node-fetch** (npm install node-fetch)
- 115 user cookies (like **CID=123;SEID=456;UID=789** grab the packet to get, it is recommended to grab the app's cookie, the validity of the longer.  
iOS can use Stream: after downloading and installing the certificate, click on start grabbing packets, switch to 115 and click on any video file, the video screen will appear to return to Stream, view the contents of the packet of 115.com, find the CID UID SEID)

## Use  
### Create a folder to install nodejs and npm dependencies.
```bash
yum install nodejs 
mkdir 115downloadRequest
cd 115downloadRequest ## Install npm packages after entering the folder, otherwise npm packages will be installed in the outer directory.
npm install express
npm install node-fetch
```
And download server.js/index.html/user.txt/run.sh to 115downloadRequest  
### Modify user.txt
```
user1/22222222/password1
```
Format: **username/directory id/password**, one per line.  
Get the catalog id: login to the web version 115, enter the catalog, the 19-digit number after the cid in the address bar.
### Modify index.html
```html 
<option value="22222222">user1</option>
```
Add checkboxes for each user, **vaule to the appropriate user catalog id, user1 to the username**
### Modify server.js
``` javascript
'Cookie': 'CID=123;SEID=456;UID=789',
```
CID, SEID, UID are changed to the cookie you grabbed.
### Modify run.sh.
```shell
nohup node /opt/listenRequest/server.js > /opt/listenRequest/log.log 2>&1 &
```
/opt/listenRequest/server.js to a **real absolute path**  
/opt/listenRequest/log.log to the absolute path of the **log file**
### Run
```bash
./run.sh
```
### Test access
Browser access, http://localhost:3000 or http://IP:3000 server is running on port 3000 by default, using http protocol.  
Modify the port in server.js, change the default 3000 to port you want.
```javascript
server.listen(3000, () => {
    console.log(new Date().toString() + ':server start listen 3000');
});
```
