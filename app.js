const path = require('path');
const fs = require('fs');
const express = require('express');
const multer  = require('multer');
const bodyParser = require('body-parser');
const moment = require('moment');
const multipart = require('connect-multiparty');
const db = require('./db');
  
const app = express();

// 设置静态资源    
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(path.join(path.dirname(process.execPath), 'public')));
// 当请求头中的content-type= application/x-www-form-urlencoded
// 负责解析的请求体的格式 是 name=123&pwd=123
app.use(bodyParser.urlencoded({ extended: false }));
// 配置body-parser解析json格式的请求体
// 解析请求头content-type=application/json
app.use(bodyParser.json());

// ajax 请求的路由
app.get('/time', (req, res) => {
  res.send(Date.now() + '');
});

app.get('/big-data', (req, res) => {
  let str = '';
  for (let i = 0; i < 1000000; i++) {
    str += Date.now();
  }
  res.send(str);
});

var users = ['zhangsan', 'lisi', 'wangwu'];
// 验证用户名用
app.post('/checkUser', (req, res) => {
  // 返回true表示用户名已经存在，返回false表示用户名不存在
  if (users.indexOf(req.body.username) > -1) {
    res.json(true);
  } else {
    res.json(false);
  }
});

// 留言板接口 -- 获取所有数据
app.get('/getMsg', (req, res) => {
  var s = require('./db.json');
  res.json(s);
});

// 留言板接口 -- 添加留言
app.post('/addMsg', (req, res) => {
  var d = {};
  d.name = req.body.name;
  d.content = req.body.content;
  d .created = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
  var s = require('./db.json');
  // console.log(d);
  // console.log(s);    
s.push(d);
  fs.writeFile('./db.json', JSON.stringify(s), (err) => {
      if (err) {
          res.json(false); 
      } else {
          res.json(true);
      }
  });
});

// FormData 使用

var multipartMiddleware = multipart();

app.post('/fd',multipartMiddleware, (req, res) => {
// console.log(req.files);
  if (JSON.stringify(req.files) === '{}') {
    res.json(req.body);
  } else {
    res.send([req.body, req.files]);
  }
// res.send(req.body);
});

// 封装使用
app.post('/query-post', (req, res) => {
  res.send(req.body);
});

app.get('/query-get', (req, res) => {
  res.send(req.query);
});


// 文件上传处理
const uploader = multer({
  storage: multer.diskStorage({
    // 上传文件存放目录
    // destination: (req, file, cb) => cb(null, path.join(path.dirname(process.execPath) + '/public/upload')),
    // destination: (req, file, cb) => cb(null, path.join(path.dirname(process.execPath) + '/public/upload')),
    destination: (req, file, cb) => cb(null, path.join(__dirname + '/public/upload')),
    // 上传文件的文件名
    filename: (req, file, cb) => cb(null, file.originalname)
  })
});

/**
 * 获取全部会员列表
 */
app.get('/api/member-list', (req, res) => {
  const data = db.get();
  res.send(data);
});

/**
 * 分页获取
 */
app.get('/api/member-list-page', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const data = db.getByPage(page, 6);
  res.send(data);
});

/**
 * 最后一条获取
 */
app.get('/api/member-list-last', (req, res) => {
  const last = parseInt(req.query.last) || null;
  const data = db.getByLast(last, 6);
  res.send(data);
});

/**
 * 获取指定会员信息
 */
app.get('/api/member-detail', (req, res) => {
  const id = parseInt(req.query.id);
  if (!id) {
    return res.status(400).send({ message: '请求参数异常' });
  }

  // 获取指定 ID 的数据
  const data = db.getById(id);

  data ? res.send(data) : res.status(404).send({ message: '未找到对应数据' });
})

/**
 * 添加一个新会员
 */
app.post('/api/member-add', uploader.single('avatar'), (req, res) => {
  // res.send([req.body, req.file]);
  if (!(req.body.name && req.body.bio && req.file)) {
    return res.status(400).send({ message: '请求参数异常' });
  }

  const member = {
    name: req.body.name,
    avatar: `/upload/${req.file.filename}`,
    bio: req.body.bio,
    created: new Date()
  };

  // 保存数据
  db.add(member);
  res.send({ message: '数据保存成功' });
});

/**
 * 删除一个会员
 */
app.get('/api/member-delete', (req, res) => {
  const id = parseInt(req.query.id);
  if (!id) {
    return res.status(400).send({ message: '请求参数异常' });
  }

  db.delete(id);
  res.send({ message: '数据删除成功' });
});

// 其他POST，统一处理
app.use((req, res) => {
  if (req.method === 'POST') {
    res.sendFile(path.join(__dirname, 'public', req.url));
  }
});

app.listen(4000, (req, res) => {
  console.log('开始监听：4000');
});