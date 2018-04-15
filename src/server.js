import {filter, first} from 'folivora';
import {Player, State, getNextPlayer} from './game';
import * as http from 'http';
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

  // TODO: 千日手を引き分けにする処理を追加する！

  // メッセージをやり取りしてゲームを進める関数を定義して、実行します。
  const winnerPromise = await (async function _(state, lastMove) {
    console.log(state.toString());

    if (state.winner) {
      return state.winner;
    }

    const legalMoves = Array.from(state.getLegalMoves());
    connections.get(state.player).sendUTF(JSON.stringify({state: state, legalMoves: legalMoves, lastMove: lastMove}));

    const moveCandidate = JSON.parse((await new Promise(resolve => connections.get(state.player).once('message', resolve))).utf8Data);
    const move = first(filter(legalMove => legalMove.equals(moveCandidate), legalMoves));

    if (!move) {
      return getNextPlayer(state.player);
    }

    return await _(state.doMove(move), move);
  })(new State(), null);

  // 勝者を表示します。
  console.log(`${ await winnerPromise == Player.black ? '先手' : '後手' }の勝ち！`);

  // サーバーを終了させます。
  server.shutDown();
  httpServer.close();
})();
