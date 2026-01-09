"use client";

import { useState } from "react";
import Button from "@/components/Button";

interface Review {
  id: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
  customer: {
    firstName?: string;
    lastName?: string;
  };
}

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [testProductId, setTestProductId] = useState("test-product-1");

  const testFetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${testProductId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        alert("Failed to fetch reviews");
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      alert("Error fetching reviews");
    }
    setLoading(false);
  };

  const testCreateReview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${testProductId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: "test-customer-1",
          rating: 5,
          title: "Excellent product!",
          content: "This is a test review created for demonstration purposes.",
          verified: true,
        }),
      });

      if (response.ok) {
        alert("Review created successfully!");
        testFetchReviews(); // Refresh reviews
      } else {
        const error = await response.json();
        alert(`Failed to create review: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating review:", error);
      alert("Error creating review");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Shopify评论服务器
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            基于 Next.js、PostgreSQL 和 Prisma 的评论管理系统
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* 卡片 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              评论管理系统
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              完整的评论CRUD操作，支持星级评分和验证购买状态。
            </p>
          </div>

          {/* 卡片 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              PostgreSQL + Prisma
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              强大的数据库ORM，支持类型安全的数据操作和迁移。
            </p>
          </div>

          {/* 卡片 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              RESTful API
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              完整的REST API，支持分页、排序和过滤功能。
            </p>
          </div>
        </div>

        {/* API 测试区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            API 测试
          </h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              测试产品ID
            </label>
            <input
              type="text"
              value={testProductId}
              onChange={(e) => setTestProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="输入产品ID"
            />
          </div>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Button
              variant="primary"
              onClick={testFetchReviews}
              disabled={loading}
            >
              {loading ? "加载中..." : "获取评论"}
            </Button>
            <Button
              variant="secondary"
              onClick={testCreateReview}
              disabled={loading}
            >
              创建测试评论
            </Button>
          </div>

          {reviews.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                评论列表 ({reviews.length})
              </h3>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }, (_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? "fill-current" : "text-gray-300"
                            }`}
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {review.customer.firstName} {review.customer.lastName}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {review.title}
                    </h4>
                  )}
                  <p className="text-gray-700 dark:text-gray-300">
                    {review.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 功能特性 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            核心功能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                评论管理
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>✅ 创建、读取、更新、删除评论</li>
                <li>✅ 星级评分系统 (1-5星)</li>
                <li>✅ 验证购买状态</li>
                <li>✅ 评论分页和排序</li>
                <li>✅ 有用投票功能</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                数据管理
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>✅ 客户信息管理</li>
                <li>✅ 产品信息同步</li>
                <li>✅ 管理员审核功能</li>
                <li>✅ 数据统计和分析</li>
                <li>✅ 类型安全的数据操作</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            查看 <a href="/api/admin/reviews" className="text-blue-500 hover:underline">管理员API</a> 或查看完整文档
          </p>
          <Button variant="primary" size="lg" onClick={() => alert('Shopify评论服务器已准备就绪!')}>
            开始使用
          </Button>
        </div>
      </div>
    </div>
  );
}
