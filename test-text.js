// 测试在原理图中创建文本的脚本
// 在 EasyEDA 控制台中运行此脚本

async function testCreateText() {
    try {
        console.log('开始测试文本创建...');

        // 测试1: 只传3个必需参数 (x, y, content)
        console.log('测试1: 3个参数 (x, y, content)');
        const result1 = await eda.sch_PrimitiveText.create(
            100,
            100,
            'Test1'
        );
        console.log('测试1结果:', result1);
        console.log('primitiveId:', result1?.primitiveId);

        // 测试2: 传5个参数 (x, y, content, rotation, textColor)
        console.log('测试2: 5个参数');
        const result2 = await eda.sch_PrimitiveText.create(
            200,
            100,
            'Test2',
            0,
            null
        );
        console.log('测试2结果:', result2);
        console.log('primitiveId:', result2?.primitiveId);

        console.log('所有测试完成');

    } catch (error) {
        console.error('测试失败:', error);
    }
}

testCreateText();
