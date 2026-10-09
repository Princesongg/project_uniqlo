# UNIQLO 포트폴리오

HTML, CSS, JavaScript와 로컬 Swiper로 만든 정적 웹사이트입니다. 실제 쇼핑몰이 아니며 로그인, 검색, 장바구니, 상품 상세 및 푸터 메뉴는 포트폴리오 안내창을 표시합니다. 찜하기와 상품 색상 변경은 페이지 안에서 동작하고 새로고침 시 초기화됩니다.

## 설치 및 검증

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd test
```

`check`는 JavaScript·HTML·CSS 문법, 내부 링크, UTF-8, 자산 경로와 파일명 대소문자를 확인합니다. `test`는 빌드한 `dist`를 로컬 서버에서 제공하고 Chromium으로 320~1920px의 14개 너비, 찜하기, 모든 상품 색상, 안내창, 키보드, 자동 재생, 모션 감소 설정 및 Swiper 로드 실패 시 대체 동작을 검증합니다.

Windows에서는 설치된 Chrome을 사용합니다. 다른 환경에서는 `npx playwright install chromium`으로 테스트 브라우저를 설치하거나 `CHROME_PATH` 환경 변수에 Chrome 실행 파일 경로를 지정하세요. 스크린샷은 Git에서 제외한 `.qa-*.png`에 저장됩니다.

## Vercel 배포

```powershell
npm.cmd run build
vercel.cmd
```

미리보기 배포를 확인한 뒤 운영 배포는 `vercel.cmd --prod`로 진행합니다. 로그인 및 프로젝트 연결은 배포하는 사용자의 Vercel 계정을 사용합니다.

`vercel.json`에 Framework `Other`에 해당하는 `framework: null`, Build Command `npm run build`, Output Directory `dist`를 지정했습니다. 기존 Vercel 프로젝트를 연결할 경우 Root Directory는 이 저장소 루트로 설정하세요. 별도 환경 변수는 필요하지 않습니다. [Vercel 빌드 설정 문서](https://vercel.com/docs/builds/configure-a-build)

빌드는 사이트 자산만 `dist`로 복사합니다. 임시 HTML, 브라우저 프로필, 캐시 및 개발용 파일은 공개 출력에 포함하지 않습니다. 배포 대상 업로드에서도 `.vercelignore`로 로컬 캐시와 임시 파일을 제외합니다.

글꼴은 기존 Pretendard CDN을 사용하므로 네트워크 연결에 따라 시스템 sans-serif로 대체될 수 있습니다. 기기의 모션 감소 설정을 반영하며, MASTERPIECE 카드에서는 공식 제품 스토리 요약과 상세 링크를 제공합니다.
+ main hero 3초간격으로 체인지 -> 마지막 -> 다시 1번 영상으로 무한 루프
+ top 버튼 hover 색상변경 -> 클릭시 main hero로 이동
+ more category , view more 버튼 -> hover 색상 변경
+ body1,2 부분 banner 2개 swiper
+ body1,2부분 컬러칩 누르면 옷 사진 변경, 하트 클릭 시 하트 채워짐
+ NEW body3 섹션 추가-> 이미지에 마우스 올리면 흰색 오버레이 호버
+ body4부분 card hover 변경
