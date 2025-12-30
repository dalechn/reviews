"use client";

import Button from "@/components/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Next.js + Tailwind CSS
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            一个现代化的React框架示例项目
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* 卡片 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              快速开发
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Next.js提供零配置的开发体验，让你可以专注于构建功能。
            </p>
          </div>

          {/* 卡片 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Tailwind CSS
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              实用优先的CSS框架，让样式开发变得简单而高效。
            </p>
          </div>

          {/* 卡片 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              响应式设计
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              内置响应式工具类，轻松创建适配各种设备的界面。
            </p>
          </div>
        </div>

        {/* 按钮演示区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            按钮组件演示
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="primary" size="sm">
              小按钮
            </Button>
            <Button variant="primary" size="md">
              中等按钮
            </Button>
            <Button variant="primary" size="lg">
              大按钮
            </Button>
            <Button variant="secondary">
              次要按钮
            </Button>
            <Button variant="outline">
              边框按钮
            </Button>
            <Button disabled>
              禁用按钮
            </Button>
          </div>
        </div>

        {/* 响应式网格演示 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            响应式网格演示
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-4 rounded-lg text-center font-semibold"
              >
                项目 {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Button variant="primary" size="lg" onClick={() => alert('欢迎使用 Next.js + Tailwind CSS!')}>
            开始使用
          </Button>
        </div>
      </div>
    </div>
  );
}
