# barium

「ごろごろどうぶつしょうぎ」の、AI対戦向けのプラットフォームです。

## Installation

~~~sh
$ git clone https://github.com/tail-island/barium.git
$ cd barium
$ npm install
$ npm run webpack
~~~

## Usage

サーバーは、以下のコマンドで実行してください。

~~~sh
$ npm run server
~~~

サンプルAIは、以下のコマンドで実行できます。

~~~sh
$ npm run sample
~~~

AIを2つ起動すると、ゲーム開始となります（最初に起動したAIが先手、次に行動したAIが後手）。ゲームの状況は、`npm run server`したコンソールに表示されます。

AIと対戦する場合は、AIを実行するかわりに、Webブラウザーで`index.html`を開いて（もしくはリロードして）ください。
