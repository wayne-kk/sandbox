// 使用 shadcn/ui 创建宠物分类筛选组件
'use client';

import { useState } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 定义筛选选项的类型
interface FilterOptions {
  category: 'cat' | 'dog' | 'bird' | '';
  age: 'puppy' | 'adult' | 'senior' | '';
  gender: 'male' | 'female' | '';
}

const PetFilter = () => {
  // 定义筛选状态
  const [filters, setFilters] = useState<FilterOptions>({
    category: '',
    age: '',
    gender: ''
  });

  // 更新筛选状态的函数
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // 提交筛选的处理函数
  const handleSubmit = () => {
    console.log('当前筛选条件:', filters);
    // 在此处添加实际的筛选逻辑
  };

  return (
    <div className="space-y-4">
      {/* 种类筛选 */}
      <div>
        <Label htmlFor="category">种类</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger id="category" className="w-full">
            选择种类
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="cat">猫</SelectItem>
            <SelectItem value="dog">狗</SelectItem>
            <SelectItem value="bird">鸟</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 年龄筛选 */}
      <div>
        <Label htmlFor="age">年龄</Label>
        <Select
          value={filters.age}
          onValueChange={(value) => handleFilterChange('age', value)}
        >
          <SelectTrigger id="age" className="w-full">
            选择年龄
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="puppy">幼年</SelectItem>
            <SelectItem value="adult">成年</SelectItem>
            <SelectItem value="senior">老年</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 性别筛选 */}
      <div>
        <Label htmlFor="gender">性别</Label>
        <Select
          value={filters.gender}
          onValueChange={(value) => handleFilterChange('gender', value)}
        >
          <SelectTrigger id="gender" className="w-full">
            选择性别
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="male">雄性</SelectItem>
            <SelectItem value="female">雌性</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 提交按钮 */}
      <Button onClick={handleSubmit} className={cn('w-full')}>
        应用筛选
      </Button>
    </div>
  );
};

export default PetFilter;
