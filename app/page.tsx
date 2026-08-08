export default function Home() {
  return (
    <main className="game-host">
      <iframe
        className="game-frame"
        src="/play/index.html"
        title="星芽跃界在线游戏"
        allow="autoplay; fullscreen"
      />
    </main>
  );
}
