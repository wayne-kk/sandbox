import { useState, useEffect } from 'react';

export interface User {
    userId: string;
    sessionId?: string;
}

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 从localStorage获取缓存的用户ID
        const cachedUserId = localStorage.getItem('userId');
        if (cachedUserId) {
            setUser({ userId: cachedUserId });
        }
        setLoading(false);
    }, []);

    // 更新用户信息
    const updateUser = (userId: string) => {
        const newUser = { userId };
        setUser(newUser);
        localStorage.setItem('userId', userId);
    };

    // 从API响应头中提取用户ID
    const extractUserFromResponse = (response: Response) => {
        const userId = response.headers.get('x-user-id');
        if (userId && (!user || user.userId !== userId)) {
            updateUser(userId);
        }
    };

    return {
        user,
        loading,
        updateUser,
        extractUserFromResponse
    };
} 