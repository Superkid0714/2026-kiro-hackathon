# Roomonic — Next.js 프론트엔드 (더미 데이터 버전)

Roomonic 디자인 v1을 기반으로 만든 실제 Next.js 프로젝트입니다.
백엔드 API 없이도 `lib/mockApi.js`의 더미 데이터로 전체 플로우가 동작합니다.

## 화면 구성 (App Router)

| 경로                     | 화면                     |
| ------------------------ | ------------------------ |
| `/`                      | 랜딩 페이지               |
| `/signup`                | 회원가입                  |
| `/login`                 | 로그인                    |
| `/profile`               | 프로필 입력                |
| `/interview`             | 인터뷰 · 일반 질문         |
| `/interview/hardcut`     | 인터뷰 · Hardcut 선택      |
| `/interview/result`      | 인터뷰 결과                |
| `/candidates`            | 후보 목록                 |
| `/candidates/[id]`       | 후보 상세                 |
| `/match-request`         | 매칭 요청                 |
| `/register`              | 내 정보 후보 등록          |
| `/chat`                  | 매칭 채팅방                |
| `/rules/draft`           | AI 생활수칙 초안           |
| `/rules/review`          | 수칙 수정 · 동의           |
| `/signature`             | 전자서명                  |
| `/final`                 | 최종 결과                 |

## 로컬 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속.

## 백엔드 연결 방법 (나중에)

`lib/mockApi.js` 안의 함수들이 유일한 데이터 접점입니다. 화면 컴포넌트는 이 함수들만
호출하므로, 백엔드가 준비되면 **이 파일 내부 로직만** 실제 `fetch('/api/...')`로 바꾸면
화면 코드는 건드릴 필요가 없습니다.

```js
// 변경 전 (더미)
export async function login({ id, password }) {
  await delay(400);
  return { ok: true, token: 'mock-token', user: { id, nickname: '지수' } };
}

// 변경 후 (실제 API)
export async function login({ id, password }) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password }),
  });
  if (!res.ok) throw new Error('로그인에 실패했어요');
  return res.json();
}
```

## EC2 배포 (요약)

1. 이 프로젝트를 GitHub 레포에 push
2. `ssh -i your-key.pem ubuntu@{EC2-퍼블릭IP}` 로 접속
3. Node.js 설치 후 `git clone {레포주소}`
4. `npm install && npm run build`
5. `pm2 start npm --name roomonic -- start` 로 상시 실행
6. Nginx로 80번 포트 → 3000번 리버스 프록시 연결
7. 보안 그룹에서 80번 포트 오픈

백엔드와 같은 EC2에서 함께 운영한다면, Nginx에서 `/api/`는 백엔드로,
나머지는 프론트로 라우팅하도록 설정하면 CORS 설정 없이 바로 연동됩니다.
(자세한 명령어는 대화 내용 참고)
