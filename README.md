# THooks

THooks — lightweight HTTP hook inspector and mock API server (в стиле MailHog для HTTP).

## Возможности

- Перехват входящих HTTP-запросов и сохранение в SQLite
- Возврат мок-ответов по шаблонам (`method + url`)
- Поддержка wildcard-шаблонов (`*` в `method` или `url`)
- Искусственная задержка ответа (`timeout`) для тестирования
- Просмотр истории запросов/ответов через API и UI

## Технологии

- Next.js (App Router)
- React + TypeScript
- Prisma ORM + SQLite (`@prisma/adapter-better-sqlite3`)

## Быстрый старт (локально)

### 1) Установка зависимостей

```bash
npm install
```

### 2) Переменные окружения

Создайте/проверьте `.env`:

```env
DATABASE_URL="file:./dev.db"
```

### 3) Подготовка БД

```bash
npx prisma db push
npx prisma generate
```

### 4) Запуск

```bash
npm run dev
```

Откройте `http://localhost:3000`.

## Docker

### Сборка образа

```bash
docker build -t thooks .
```

### Запуск контейнера

```bash
docker run --rm -p 3000:3000 -v thooks-data:/app/data thooks
```

В контейнере БД хранится в volume `thooks-data` (файл `./data/dev.db`).

## Скрипты

- `npm run dev` — запуск в dev-режиме
- `npm run build` — production-сборка
- `npm run start` — запуск production-сервера
- `npm run lint` — ESLint

## API

### 1) Mock endpoints

Поддерживаемые методы: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`

- `/api`
- `/api/mock/*`

Каждый запрос:
1. Сохраняется в таблицу `Request`
2. Для него выбирается шаблон ответа
3. Возвращается ответ клиенту
4. Фактический ответ сохраняется в таблицу `Response`

### 2) Управление шаблонами

#### `GET /api/templates`

Возвращает список шаблонов:

```json
{
	"items": [
		{
			"id": "...",
			"name": "GET /api/mock/users",
			"method": "GET",
			"url": "/api/mock/users",
			"status": 200,
			"timeout": 0,
			"headers": { "Content-Type": "application/json" },
			"body": "{\"ok\":true}",
			"createdAt": "2026-04-05T08:00:00.000Z"
		}
	]
}
```

#### `POST /api/templates`

Создает шаблон ответа.

Тело запроса:

```json
{
	"name": "users list",
	"method": "GET",
	"url": "/api/mock/users",
	"status": 200,
	"timeout": 0,
	"headers": {
		"Content-Type": "application/json"
	},
	"body": "{\"items\":[{\"id\":1,\"name\":\"Nikita\"}]}"
}
```

Обязательные поля: `method`, `url`.

Если `name` не передан, будет создан автоматически: `<METHOD> <URL>`.

### 3) Просмотр перехваченных запросов

#### `GET /api/requests`

Параметры:

- `page` (default: `1`)
- `pageSize` (default: `50`, min: `1`, max: `200`)
- `method` (фильтр по методу)
- `url` (поиск по вхождению URL)

Пример:

```http
GET /api/requests?page=1&pageSize=50&method=GET&url=/api/mock
```

Ответ:

```json
{
	"page": 1,
	"pageSize": 50,
	"items": [
		{
			"id": "...",
			"method": "GET",
			"url": "/api/mock/users",
			"headers": {
				"host": "localhost:3000"
			},
			"body": null,
			"createdAt": "2026-04-05T08:00:00.000Z",
			"response": {
				"id": "...",
				"requestId": "...",
				"status": 200,
				"headers": {
					"Content-Type": "application/json"
				},
				"body": "{\"ok\":true}",
				"createdAt": "2026-04-05T08:00:00.100Z"
			}
		}
	]
}
```

## Логика выбора шаблона

THooks ищет шаблон среди трех вариантов (в порядке приоритета):

1. Полное совпадение: `method === request.method` и `url === request.url`
2. Wildcard method: `method === "*"` и `url === request.url`
3. Wildcard url: `method === request.method` и `url === "*"`

Если шаблон не найден, используется дефолтный ответ:

```json
{
	"status": 200,
	"timeout": 0,
	"headers": {},
	"body": "{ \"message\": \"OK\" }"
}
```

## Особенности URL и заголовков

- Для матчинга используется `pathname + search` (query-параметры включены)
- Перед сохранением `method` шаблона нормализуется в uppercase
- В ответ автоматически добавляется `Content-Type: application/json`, если заголовки переданы объектом

## Структура проекта

```text
src/
	app/
		api/
			route.ts                  # /api
			mock/[...path]/route.ts   # /api/mock/*
			templates/route.ts        # CRUD шаблонов (GET, POST)
			requests/route.ts         # список перехваченных запросов
	services/
		requestService.ts           # основная логика обработки запроса
	repositories/
		requestRepository.ts
		responseRepository.ts
		responseTemplateRepository.ts
	prisma.ts                     # Prisma client + sqlite adapter
prisma/
	schema.prisma
```

## Troubleshooting

### Ошибка `P2021: The table ... does not exist`

База не синхронизирована со схемой Prisma. Выполните:

```bash
npx prisma db push
```

Проверьте, что `DATABASE_URL` указывает на ту же БД, которую использует приложение.

## License

Проект распространяется под лицензией MIT. Подробности: [LICENSE](LICENSE).
