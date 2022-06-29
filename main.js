// サーバーを扱うためのモジュールを読み込み
var server = require('http').createServer(head);
// ファイルを扱うためのモジュールを読み込み
var html = require('fs').readFileSync('index.html');

// 起動するサーバーのポート番号
// or演算子を使うことでherokuのアドレスがあった時はherokuのアドレスが代入される
var port = process.env.PORT || 3000;

// 通信する外部アプリのURL、別途環境変数に設定する
var url = process.env.LARAVEL_URL || "http://127.0.0.1:8000";

// socket.ioを読み込み
var io = require('socket.io')(server,{
  cors:{
    origin: ["http://localhost:8000", url],
    methods: ["GET", "POST", "DELETE", "OPTIONS"]
  }
});

// サーバーにリクエストが来た時の処理
// reqがリクエスト　resがレスポンス
// writeHeadでヘッダー情報を書き込みindex.htmlを返す
function head(req, res){
  res.writeHead(200, {'Content-type': 'text/html'});
  res.end(html);
}


// サーバーをローカルなら3000ポート、herokuならその時のポートで起動する
server.listen(port);

// ユーザー情報を保存する変数
var users = new Object();

io.on('connection', function(socket){
  // ログイン時ユーザー情報を控える
  socket.on('user_set', function(data){
    users[socket.id] = data.id;
    console.log(users);
  });

  // 接続切断時の処理
  socket.on('disconnect', function(data){
    delete users[socket.id];
    console.log(users);
  });

  // ルームと接続する
  socket.on("room_in", function(data){
    // ルームIDを控えておく
    socket.room = data.id

    socket.room_type = data.room_type

    socket.join(`${socket.room_type}_${socket.room}`);

    
    console.log(socket.rooms);
  });

  // メッセージが作成されたとき
  socket.on('create', function(data){
    // io.to(`c_${data.room_id}`).emit('create', {id: data.id});
    console.log('create socket ok' + `${socket.room_type}_${socket.room}`);
    io.to(`${socket.room_type}_${socket.room}`).emit('create', {id: data.id});

  });

  // メッセージが更新されたとき
  socket.on('update', function(data){
    io.to(`${socket.room_type}_${socket.room}`).emit('update', {id: data.id});
  });

  // メッセージが削除されたとき
  socket.on('delete', function(data){
    io.to(`${socket.room_type}_${socket.room}`).emit('delete', {id: data.id});
  });


  // メッセージ作成時の未読通知
  socket.on('push', function(data){

    var socket_id = new Array();
    // 保存しておいたソケットIDにチャンネルに所属するユーザーidがあるか調べてsocket.idを配列にする
    for(var key in users){
      if(data.users.includes(users[key])){
        socket_id.push(key);
      }
    }
    io.to(socket_id).emit('push', {room_id: data.room_id, user_id: data.user_id});
  });
});


