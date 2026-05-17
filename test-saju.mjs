import { calculateSaju } from './core/src/saju.ts';

// 테스트 사주: 1982-09-08 07:00 서울
const input = {
  year: 1982,
  month: 9,
  day: 8,
  hour: 7,
  minute: 0,
  gender: 'M',
  latitude: 37.5665,
  longitude: 126.9780,
  timezone: 'Asia/Seoul'
};

const result = calculateSaju(input);

console.log('=== 사주 계산 결과 ===');
console.log('Pillars:');
result.pillars.forEach((p, i) => {
  const pillarNames = ['時柱', '日柱', '月柱', '年柱'];
  console.log(`${pillarNames[i]}: ${p.pillar.ganzi} (천간: ${p.pillar.stem}, 지지: ${p.pillar.branch})`);
});

console.log('\n=== 예상값 ===');
console.log('時柱: 丁卯 (천간: 丁, 지지: 卯)');
console.log('日柱: 甲午 (천간: 甲, 지지: 午)');
console.log('月柱: 庚申 (천간: 庚, 지지: 申)');
console.log('年柱: 壬戌 (천간: 壬, 지지: 戌)');
