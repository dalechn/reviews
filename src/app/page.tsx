"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/components/Button";
import VideoPlayer from "@/components/VideoPlayer";

// 使用原生video元素替代 ReactPlayer

interface Review {
  id: string;
  rating: number;
  title?: string;
  content: string;
  mediaUrls: string[];
  verified: boolean;
  published: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    shopifyId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
  product: {
    id: string;
    shopifyId: string;
    title: string;
    handle: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
}

// VideoPlayer component moved to src/components/VideoPlayer.tsx

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [testProductId, setTestProductId] = useState("test-product-2");
  const [testRating, setTestRating] = useState(5);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [allReviewsPagination, setAllReviewsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const testFetchReviews = async () => {
    setLoading(true);
    try {
      // First, find the product by shopifyId to get the actual product ID
      const productResponse = await fetch(`/api/products?shopifyId=${testProductId}`);
      if (productResponse.ok) {
        const product = await productResponse.json();
        const response = await fetch(`/api/products/${product.id}/reviews`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
        } else {
          setReviews([]); // Product exists but no reviews
        }
      } else {
        setReviews([]); // Product doesn't exist
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    }
    setLoading(false);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(prev => [...prev, data.url]);
        return data.url;
      } else {
        const error = await response.json();
        alert(`上传失败: ${error.error}`);
        return null;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('上传文件时出错');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fetchAllReviews = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews/all?page=${page}&limit=${limit}&sortBy=createdAt&sortOrder=desc`);
      if (response.ok) {
        const data = await response.json();
        setAllReviews(data.reviews || []);
        setAllReviewsPagination(data.pagination);
        setShowAllReviews(true);
      } else {
        alert("Failed to fetch all reviews");
      }
    } catch (error) {
      console.error("Error fetching all reviews:", error);
      alert("Error fetching all reviews");
    }
    setLoading(false);
  };

  const testCreateReview = async () => {
    setLoading(true);
    try {
      // First, ensure the test customer exists
      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopifyId: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
          shopId: 'default-shop',
        }),
      });

      if (!customerResponse.ok) {
        throw new Error('Failed to create test customer');
      }

      const customer = await customerResponse.json();
      const customerId = customer.id;

      // First, check if the product already exists
      let productId;
      const existingProductResponse = await fetch(`/api/products?shopifyId=${testProductId}`);

      if (existingProductResponse.ok) {
        // Product exists, use it
        const existingProduct = await existingProductResponse.json();
        productId = existingProduct.id;
      } else {
        // Product doesn't exist, create it
        const createProductResponse = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopifyId: testProductId,
            title: `Test Product (${testProductId})`,
            handle: testProductId,
            imageUrl: 'https://example.com/product.jpg',
            shopId: 'default-shop',
          }),
        });

        if (!createProductResponse.ok) {
          if (createProductResponse.status === 409) {
            throw new Error('Product handle already exists. Please use a different product ID.');
          }
          throw new Error('Failed to create test product');
        }

        const newProduct = await createProductResponse.json();
        productId = newProduct.id;
      }

      // Now create the review using the actual product ID
      const reviewResponse = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerId,
          rating: testRating,
          title: `Test review - ${testRating} star${testRating !== 1 ? 's' : ''}`,
          content: `This is a test review with ${testRating} star${testRating !== 1 ? 's' : ''} rating created for demonstration purposes.`,
          mediaUrls: uploadedFiles,
          verified: true,
        }),
      });

      if (reviewResponse.ok) {
        alert("Review created successfully!");
        setUploadedFiles([]); // Clear uploaded files
        testFetchReviews(); // Refresh reviews
      } else {
        const error = await reviewResponse.json();
        alert(`Failed to create review: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating review:", error);
      alert("Error creating review: " + (error as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            评论管理系统
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            测试和查看产品评论
          </p>
        </div>

        {/* 控制面板 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                产品ID
              </label>
            <input
              type="text"
              value={testProductId}
              onChange={(e) => setTestProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="输入产品ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              上传图片/视频 (可选)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await uploadFile(file);
                }
              }}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900 dark:file:text-blue-300
                hover:file:bg-blue-100 dark:hover:file:bg-blue-800
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {uploading && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">正在上传...</p>
            )}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">已上传文件:</p>
                {uploadedFiles.map((url, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                    {url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') ? (
                      <div className="w-16 h-16 rounded overflow-hidden">
                        <VideoPlayer src={url} />
                      </div>
                    ) : (
                      <img src={url} alt="上传的文件" className="w-16 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {url.split('/').pop()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeUploadedFile(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                测试评论评分
              </label>
              <select
                value={testRating}
                onChange={(e) => setTestRating(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value={1}>1 星</option>
                <option value={2}>2 星</option>
                <option value={3}>3 星</option>
                <option value={4}>4 星</option>
                <option value={5}>5 星</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
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
            <Button
              variant="outline"
              onClick={() => fetchAllReviews()}
              disabled={loading}
            >
              {loading ? "加载中..." : "获取所有评论"}
            </Button>
          </div>
        </div>

        {/* 评论列表 */}
        {((showAllReviews && allReviews.length > 0) || (!showAllReviews && reviews.length > 0)) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {showAllReviews ? "所有评论" : "评论列表"}
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  共 {showAllReviews ? allReviewsPagination.total : reviews.length} 条评论
                </span>
                {showAllReviews && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllReviews(false)}
                  >
                    返回产品评论
                  </Button>
                )}
              </div>
            </div>

            {(showAllReviews ? allReviews : reviews).map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }, (_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${
                              i < (review.rating || 0) ? "fill-current" : "text-gray-300"
                            }`}
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {review.rating}/5
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {review.customer.firstName} {review.customer.lastName}
                      </span>
                      {review.customer.email && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                          ({review.customer.email})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(review.createdAt).toLocaleString()}
                    </div>
                    {review.verified && (
                      <div className="flex items-center justify-end mt-1">
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-green-600 dark:text-green-400">已验证</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-2">产品信息</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <div><span className="font-medium">名称:</span> {review.product.title}</div>
                    <div><span className="font-medium">ID:</span> {review.product.shopifyId}</div>
                    <div><span className="font-medium">句柄:</span> {review.product.handle}</div>
                    {review.product.imageUrl && (
                      <div>
                        <span className="font-medium">图片:</span>{" "}
                        <a
                          href={review.product.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          查看
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-2">客户信息</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <div><span className="font-medium">ID:</span> {review.customer.shopifyId}</div>
                    <div><span className="font-medium">姓名:</span> {review.customer.firstName} {review.customer.lastName}</div>
                    {review.customer.email && <div><span className="font-medium">邮箱:</span> {review.customer.email}</div>}
                    <div><span className="font-medium">注册:</span> {new Date(review.customer.createdAt).toLocaleDateString()}</div>
                    {review.customer.avatarUrl && (
                      <div className="md:col-span-2">
                        <span className="font-medium">头像:</span>{" "}
                        <a
                          href={review.customer.avatarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          查看
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-4">
                  {review.title && (
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {review.title}
                    </h4>
                  )}
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {review.content}
                  </p>

                  {/* Media Files */}
                  {review.mediaUrls && review.mediaUrls.length > 0 && (
                    <div className="mt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {review.mediaUrls.map((url, index) => (
                          <div key={index} className="relative">
                            {url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') ? (
                              <div className="w-full h-96 bg-black rounded-lg overflow-hidden">
                                <VideoPlayer src={url} />
                              </div>
                            ) : (
                              <img
                                src={url}
                                alt={`媒体文件 ${index + 1}`}
                                className="w-full max-h-64 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-200 dark:border-gray-600"
                                onClick={() => window.open(url, '_blank')}
                                loading="lazy"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <span>ID: {review.id}</span>
                  <div className="flex items-center space-x-4">
                    <span>有用: {review.helpful}</span>
                    <span>状态: {review.published ? "已发布" : "未发布"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页控制 */}
        {showAllReviews && allReviewsPagination.pages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 mt-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              第 {allReviewsPagination.page} 页，共 {allReviewsPagination.pages} 页
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAllReviews(allReviewsPagination.page - 1)}
                disabled={allReviewsPagination.page <= 1 || loading}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAllReviews(allReviewsPagination.page + 1)}
                disabled={allReviewsPagination.page >= allReviewsPagination.pages || loading}
              >
                下一页
              </Button>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {reviews.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无评论</h3>
            <p className="text-gray-500 dark:text-gray-400">点击"创建测试评论"来添加第一条评论</p>
          </div>
        )}
      </div>
    </div>
  );
}
