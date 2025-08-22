// 使用 shadcn/ui 组件库创建的联系表单组件
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

// 定义表单数据的类型
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function ContactForm() {
  // 使用状态管理表单数据
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  // 处理表单输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // 在此处添加提交逻辑，例如 API 调用
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto p-4">
      {/* 姓名字段 */}
      <div>
        <Label htmlFor="name">姓名</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="请输入您的姓名"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      {/* 邮箱字段 */}
      <div>
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="请输入您的邮箱"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      {/* 电话字段 */}
      <div>
        <Label htmlFor="phone">电话</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="请输入您的电话"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      {/* 留言内容字段 */}
      <div>
        <Label htmlFor="message">留言内容</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="请输入您的留言"
          value={formData.message}
          onChange={handleChange}
          required
        />
      </div>

      {/* 提交按钮 */}
      <Button type="submit" className="w-full">提交</Button>
    </form>
  );
}
