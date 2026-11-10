export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="w-full max-w-md flex flex-col items-center text-center p-8 sm:p-10 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-zinc-800">
        {/* 프로필 아바타 */}
        <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md shadow-indigo-500/20">
          홍
        </div>

        {/* 이름 */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          홍길동
        </h1>

        {/* 뱃지 태그 */}
        <span className="mt-2 inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
          대학생 · Vibe Coding
        </span>

        {/* 소개글 */}
        <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-base leading-relaxed break-keep">
          안녕하세요! 바이브 코딩을 배우고 있는 대학생입니다.
        </p>

        {/* 링크 / 액션 */}
        <div className="w-full mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer">
            GitHub
          </span>
          <span>•</span>
          <span className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer">
            Blog
          </span>
          <span>•</span>
          <span className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer">
            Contact
          </span>
        </div>
      </main>
    </div>
  );
}
