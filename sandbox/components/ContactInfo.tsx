// 使用 shadcn/ui 组件库实现联系方式组件
'use client';

import { FC } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Twitter, Facebook, Instagram } from 'lucide-react';

// 定义社交媒体链接的类型
interface SocialLink {
  platform: string;
  url: string;
  icon: JSX.Element;
}

// 定义组件的 Props 类型
interface ContactInfoProps {
  email: string;
  phone: string;
  socialLinks: SocialLink[];
}

const ContactInfo: FC<ContactInfoProps> = ({ email, phone, socialLinks }) => {
  return (
    <Card className="w-full max-w-md mx-auto p-4">
      <CardHeader>
        <CardTitle>联系方式</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 邮箱信息 */}
        <div className="flex items-center space-x-2 mb-4">
          <Mail className="w-5 h-5 text-gray-600" />
          <span>{email}</span>
        </div>

        <Separator />

        {/* 电话信息 */}
        <div className="flex items-center space-x-2 my-4">
          <Phone className="w-5 h-5 text-gray-600" />
          <span>{phone}</span>
        </div>

        <Separator />

        {/* 社交媒体链接 */}
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-gray-700">关注我们：</p>
          <div className="flex space-x-4">
            {socialLinks.map((link) => (
              <Button
                key={link.platform}
                asChild
                variant="ghost"
                className="p-2"
              >
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.icon}
                </a>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactInfo;

// 示例用法
// <ContactInfo
//   email="example@example.com"
//   phone="123-456-7890"
//   socialLinks={[
//     { platform: 'Twitter', url: 'https://twitter.com', icon: <Twitter className="w-5 h-5" /> },
//     { platform: 'Facebook', url: 'https://facebook.com', icon: <Facebook className="w-5 h-5" /> },
//     { platform: 'Instagram', url: 'https://instagram.com', icon: <Instagram className="w-5 h-5" /> },
//   ]}
// />