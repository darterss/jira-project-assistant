# Jira Project Assistant

##  Структура проекта

- **`apps/forge-app`** — Forge backend, работающий внутри Atlassian Cloud
- **`frontend`** — React + Vite frontend с кастомным UI

##  Запуск

### Вариант 1: Разработка (с `forge tunnel`)

Разработка с использованием туннелирования Forge.

#### Шаг 1: Установка Forge CLI

Установите Forge CLI и выполните вход в систему:

```bash
sudo npm install -g @forge/cli
forge login
```

#### Шаг 2: Запуск dev-сервера

Поднимите dev-сервер фронтенда в Docker:

```bash
docker-compose up --build
```


#### Шаг 3: Настройка туннеля

В отдельном терминале выполните:

```bash
cd apps/forge-app
npm install
forge deploy --environment development
forge install --environment development
forge tunnel
```
Forge прокинет localhost:5173 внутрь Jira.
Теперь Jira будет забирать кастомный UI из вашего локального контейнера.
(если после этого отключите forge tunnel - то фронтенд переключится на собранный в папке apps/forge-app/resources/static/main)

#### Шаг 4: Вход на сайт

Зайдите в Jira Cloud, откройте страницу, где встраивается Forge App → UI загрузится из докера (при запущенном forge tunnel). В этом режиме можете изменять исходный код как фронтенда, так и бэкенда - отображение на сайте будут непрерывно обновляться.

### Вариант 2: Продакшн

#### Шаг 1: Сборка образа

Установите Forge CLI и выполните вход в систему:

```bash
sudo npm install -g @forge/cli
forge login
````

#### Шаг 2: Деплой в Atlassian Cloud

Разверните и установите приложение в Atlassian Cloud:

```bash
cd apps/forge-app
npm install
forge deploy --environment production
forge install --environment production
```
При этом Forge возьмёт уже собранный фронтенд из папки `apps/forge-app/resources/static/main`.

#### Шаг 3: Вход на сайт

Зайдите в Jira Cloud, откройте страницу, где встраивается Forge App.

## Требования

- Node.js
- Docker и Docker Compose
- Forge CLI
- Аккаунт Atlassian Developer

## Ссылки

- [Документация Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/)
- [Atlassian Developer Console](https://developer.atlassian.com/console/)