// 调试环境变量
console.log('=== 环境变量调试 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SERVER_HOST:', process.env.SERVER_HOST);
console.log('NEXT_PUBLIC_SERVER_HOST:', process.env.NEXT_PUBLIC_SERVER_HOST);

// 模拟getServerHost函数
function getServerHost() {
    if (process.env.SERVER_HOST) {
        return process.env.SERVER_HOST;
    }

    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_SERVER_HOST || 'localhost';
    }

    return window.location.hostname;
}

// 模拟getSandboxUrl函数
function getSandboxUrl(port) {
    const host = getServerHost();
    if (typeof window !== 'undefined') {
        return `${window.location.protocol}//${window.location.host}/sandbox`;
    }
    return `http://${host}:8080/sandbox`;
}

console.log('\n=== URL生成测试 ===');
console.log('getServerHost():', getServerHost());
console.log('getSandboxUrl():', getSandboxUrl());
console.log('getSandboxUrl(3101):', getSandboxUrl(3101));

// 测试不同的环境变量设置
console.log('\n=== 测试不同环境变量 ===');
process.env.SERVER_HOST = '115.190.100.24';
console.log('设置SERVER_HOST=115.190.100.24后:');
console.log('getServerHost():', getServerHost());
console.log('getSandboxUrl():', getSandboxUrl());
