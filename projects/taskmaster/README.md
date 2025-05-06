# TaskMaster

A modern task management application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Create, update, and delete tasks
- Set task priorities (Low, Medium, High)
- Add due dates to tasks
- Mark tasks as complete/incomplete
- Filter tasks by priority and completion status
- Persistent storage using localStorage
- Responsive design for all devices

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- date-fns for date formatting

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page (redirects to /tasks)
│   └── tasks/          # Tasks page
│       └── page.tsx    # Main tasks page component
├── components/         # React components
│   ├── TaskForm.tsx   # Form for adding/editing tasks
│   └── TaskList.tsx   # List of tasks with filtering
├── hooks/             # Custom React hooks
│   └── useTasks.ts    # Task management hook
└── types/             # TypeScript type definitions
    └── task.ts        # Task-related types
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT 