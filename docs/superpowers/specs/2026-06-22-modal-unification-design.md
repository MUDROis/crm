# Унификация модальных окон

## Проблема
Каждая форма (StudentForm, GroupForm, LessonForm, TaskForm, TeacherForm) и информационные модалки (LessonCardModal, StudentInfoModal) содержат дублированную inline-реализацию модального окна: overlay с затемнением, контейнер, заголовок — всё с разной стилизацией.

## Решение
Создать переиспользуемый компонент `Modal` и заменить им дублированные реализации во всех 7 компонентах.

## Компонент Modal
- `isOpen: boolean` — управление видимостью
- `onClose: () => void` — закрытие по оверлею или крестику
- `title: string` — заголовок модалки
- `children: React.ReactNode` — содержимое
- `maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'` — маппинг на tailwind-классы `max-w-*`

Поведение:
- При `isOpen=false` возвращает `null`
- Затемнение: `bg-black/40 backdrop-blur-sm`
- Закрытие: по клику на overlay (onClick на внешнем div) и по крестику ×
- Контейнер: белый фон, скруглённые углы, тень, padding, max-height с overflow-y-auto
- Клик внутри контейнера не всплывает (stopPropagation)

## Изменяемые компоненты

| Компонент | maxWidth |
|---|---|
| StudentForm | 2xl |
| GroupForm | xl |
| LessonForm | 2xl |
| TaskForm | md |
| TeacherForm | md |
| LessonCardModal (view) | lg |
| LessonCardModal (edit) | 2xl |
| StudentInfoModal | 4xl |

## Структура файлов
- Новый: `src/components/ui/Modal.tsx`
- Изменяемые: 5 форм + 2 модалки (все в `src/components/`)

## Порядок реализации
1. Создать `src/components/ui/Modal.tsx`
2. Обновить StudentForm, GroupForm, LessonForm, TaskForm, TeacherForm
3. Обновить LessonCardModal, StudentInfoModal
