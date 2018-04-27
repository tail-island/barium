import {count, filter, first} from 'folivora';
import {Player, State, getNextPlayer} from './game';
import * as http from 'http';
import {performance} from 'perf_hooks';
import {server as WebSocketServer} from 'websocket';

// ごめんなさい。とりあえず、エラー処理とセキュリティーは丸ごと無視で……。

(async () => {
  // サーバーを作成します。
  const httpServer = http.createServer().listen(8080);
  const server = new WebSocketServer({
    autoAcceptConnections: true,
    httpServer:            httpServer,
    keepalive:             false
  });

  // コネクションを2つ取得します。
  const connections = new Map([[Player.black, await new Promise(resolve => server.once('connect', resolve))],    // awaitが必要なので、重複を許してください……。async function*は、なんかエラーになっちゃった。
                               [Player.white, await new Promise(resolve => server.once('connect', resolve))]]);  // どう書けばいいんだろ？ KotlihのsuspendCoroutineは使い勝手が良かったなぁ……。

  // 千日手判定用の、過去の状態を表現する変数。
  const pastStates = [];

  // メッセージをやり取りしてゲームを進める関数を定義して、実行します。
  const winner = await (async function _(state, lastMove) {
    // とりあえず、盤面をコンソールに表示します。
    console.log(state.toString());

    // 勝敗が決した場合は、勝者をリターンします。
    if (state.winner) {
      return state.winner;
    }

    // 千日手判定用に、状態を追加します。
    pastStates.push(state);

    // 千日手（同一局面が3回）は、引き分けとします。
    if (count(filter(pastState => pastState.equals(state), pastStates)) >= 3) {
      return null;
    }

    // 合法手を取得します。
    const legalMoves = Array.from(state.getLegalMoves());

    // 状態、合法手、敵が打った手をプレイヤーに送信します。
    connections.get(state.player).sendUTF(JSON.stringify({state: state, legalMoves: legalMoves, lastMove: lastMove}));

    console.time('Player using');

    // プレイヤーの応答を受信します。
    const message = await new Promise(resolve => connections.get(state.player).once('message', resolve));

    console.timeEnd('Player using');

    // プレイヤーが選択した手を取得します。
    const moveCandidate = JSON.parse(message.utf8Data);

    console.log('move:', moveCandidate);

    // 合法手かチェックします。
    const move = first(filter(legalMove => legalMove.equals(moveCandidate), legalMoves));
    if (!move) {
      return getNextPlayer(state.player);
    }

    // 手を実行して状態を進めて、再帰呼び出しして、ゲームを続けます。
    return await _(state.doMove(move), move);
  })(new State(), null);

  // 結果を表示します。
  console.log((() => {
    if (!winner) {
      return '引き分け';
    } else {
      return `${ winner == Player.black ? '先手' : '後手' }の勝ち！`;
    }
  })());

  // サーバーを終了させます。
  server.shutDown();
  httpServer.close();
})();
