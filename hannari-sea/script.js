document.addEventListener('DOMContentLoaded', () => {
    const fishes = document.querySelectorAll('.fish');
  
    fishes.forEach(fish => {
      setInterval(() => {
        const randomTop = Math.random() * 80 + 10; // 10%～90%の高さ
        fish.style.top = `${randomTop}%`;
  
        const randomSize = Math.random() * 0.5 + 0.75; // サイズのランダム化
        fish.style.transform = `scale(${randomSize})`;
      }, 3000); // 3秒ごとに変更
    });
  });