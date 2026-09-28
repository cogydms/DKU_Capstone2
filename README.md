# DKU_Capstone2 개발 가이드

## 🌿 Git Branch 전략

우리 팀은 아래와 같은 브랜치 구조를 사용합니다.

```text
main
  ↑
develop
  ↑
feature/*
```

### `main`

- 최종적으로 동작이 확인된 안정 버전을 관리합니다.
- 직접 개발하지 않습니다.
- 기능 개발이 완료되고 통합 테스트가 끝난 코드만 반영합니다.

### `develop`

- 각 기능을 통합하는 개발 브랜치입니다.
- 각자의 `feature/*` 브랜치에서 개발을 완료한 후 Pull Request를 통해 병합합니다.
- 새로운 기능 브랜치를 만들 때는 최신 `develop` 브랜치를 기준으로 생성합니다.

### `feature/*`

- 각 기능을 개발하는 작업 브랜치입니다.
- 브랜치 이름은 아래 형식을 사용합니다.

```text
feature/기능명
```

예시:

```text
feature/document
feature/analysis
feature/action-plan
feature/task-management
feature/crawler
```

기능 개발이 끝나면 GitHub에 Push한 뒤 `develop` 브랜치로 Pull Request를 생성합니다.

```text
feature/*
    ↓ Pull Request
develop
    ↓ 통합 및 테스트
main
```

---

## 🚀 처음 프로젝트를 시작하는 방법

### 1. Repository Clone

터미널에서 프로젝트를 내려받습니다.

```bash
git clone https://github.com/sungjw0408/DKU_Capstone2.git
```

### 2. 프로젝트 폴더로 이동

```bash
cd DKU_Capstone2
```

### 3. 원격 저장소 확인

```bash
git remote -v
```

정상적으로 연결되어 있다면 아래와 비슷하게 표시됩니다.

```text
origin  https://github.com/sungjw0408/DKU_Capstone2.git (fetch)
origin  https://github.com/sungjw0408/DKU_Capstone2.git (push)
```

### 4. `develop` 브랜치로 이동

```bash
git switch develop
```

### 5. 최신 `develop` 코드 받아오기

작업을 시작하기 전에 항상 최신 코드를 받아옵니다.

```bash
git pull origin develop
```

### 6. 본인 기능 브랜치 생성

예를 들어 AI 분석 기능을 개발한다면:

```bash
git switch -c feature/analysis
```

다른 기능을 개발한다면 기능명에 맞게 변경합니다.

```bash
git switch -c feature/기능명
```

### 7. 현재 브랜치 확인

```bash
git branch
```

예시:

```text
  develop
* feature/analysis
  main
```

`*` 표시가 현재 작업 중인 브랜치입니다.

---

### 작업 시작 전 기본 순서

매번 개발을 시작할 때는 아래 순서를 권장합니다.

```bash
git switch develop
git pull origin develop
git switch feature/본인기능
git merge develop
```

새로운 기능을 처음 시작하는 경우:

```bash
git switch develop
git pull origin develop
git switch -c feature/기능명
```

> `main` 브랜치에서는 직접 기능 개발을 진행하지 않습니다.
