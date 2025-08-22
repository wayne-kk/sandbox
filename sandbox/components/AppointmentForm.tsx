// 使用 shadcn/ui 组件库创建一个预约表单组件
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AppointmentFormProps {}

const AppointmentForm: React.FC<AppointmentFormProps> = () => {
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [contactInfo, setContactInfo] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 提交逻辑
    console.log({ selectedService, selectedDate, selectedTime, contactInfo });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 服务类型选择 */}
      <div>
        <Label htmlFor="service">服务类型</Label>
        <Select onValueChange={setSelectedService}>
          <SelectTrigger id="service">
            <SelectValue placeholder="请选择服务类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consultation">咨询</SelectItem>
            <SelectItem value="maintenance">维护</SelectItem>
            <SelectItem value="installation">安装</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 日期选择 */}
      <div>
        <Label htmlFor="date">日期</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('w-full justify-start', !selectedDate && 'text-muted-foreground')}>
              {selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '请选择日期'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
          </PopoverContent>
        </Popover>
      </div>

      {/* 时间选择 */}
      <div>
        <Label htmlFor="time">时间</Label>
        <Select onValueChange={setSelectedTime}>
          <SelectTrigger id="time">
            <SelectValue placeholder="请选择时间" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="09:00">09:00</SelectItem>
            <SelectItem value="10:00">10:00</SelectItem>
            <SelectItem value="11:00">11:00</SelectItem>
            <SelectItem value="14:00">14:00</SelectItem>
            <SelectItem value="15:00">15:00</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 联系方式 */}
      <div>
        <Label htmlFor="contact">联系方式</Label>
        <Input
          id="contact"
          type="text"
          placeholder="请输入您的联系方式"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
        />
      </div>

      {/* 提交按钮 */}
      <Button type="submit" className="w-full">
        提交预约
      </Button>
    </form>
  );
};

export default AppointmentForm;
