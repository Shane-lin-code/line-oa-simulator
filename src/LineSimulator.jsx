// 1. Imports
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Trash2, Settings, Play, RefreshCw, User, ChevronDown, ChevronRight } from 'lucide-react';

const OA_AVATAR = "https://itix.qrgo.com.tw/farglory-oceanpark/img/cms/01_02.jpg";

// Accordion Component
const AccordionCategory = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition text-slate-700 font-bold text-xs uppercase tracking-wider"
            >
                {title}
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isOpen && (
                <div className="bg-white p-2 space-y-1">
                    {children}
                </div>
            )}
        </div>
    );
};

// 2. Component Shell
const LineSimulator = () => {
    // --- 真正的 State 管理 ---
    const [params, setParams] = useState({
        shop_name: '膂盟大飯店',
        user_name: 'James',
        product_name: '極上一泊二食 | ITF台北國際旅展住宿券'
    });

    const [scenarios, setScenarios] = useState([]); // 存儲從 GAS 抓來的情境
    const [messages, setMessages] = useState([]);   // 存儲聊天室顯示的訊息
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const messagesEndRef = useRef(null); // 用於自動捲動

    // --- GAS 資料獲取邏輯 ---
    const fetchScenarios = async () => {
        setIsLoading(true);
        try {
            // 這裡使用了 redirect: 'follow' 來處理 
            //  的跳轉
            // 判斷環境：開發環境用 Proxy，正式環境直接用 GAS URL
            const GAS_URL = 'https://script.google.com/macros/s/AKfycbz4ZJnDoHTYPIG1Hy4TQz6lbkC71qhbJOPPIRuJVHNNyCCjXSwaZEy7nBK2E_RLB2xC/exec';
            const apiUrl = import.meta.env.DEV ? '/api/gas' : GAS_URL;

            const response = await fetch(
                apiUrl,
                { method: 'GET' }
            );
            const text = await response.text();
            try {
                let data = JSON.parse(text);

                // 安全檢查：確認回傳的是陣列
                if (!Array.isArray(data)) {
                    console.error("Data format error: expected array but got", typeof data, data);
                    // 如果 GAS 回傳了錯誤物件 (例如 {error: "..."})
                    if (data && data.error) {
                        alert(`讀取錯誤: ${data.error}`);
                    } else {
                        alert("讀取到的資料格式不正確，請檢查 GAS 程式碼");
                    }
                    setScenarios([]); // 設為空陣列避免崩潰
                } else {
                    setScenarios(data);
                }
            } catch (e) {
                console.error("JSON Parse Error. Received content:", text);
                alert("無法解析伺服器回應");
                setScenarios([]);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("讀取失敗，請檢查 GAS 連結");
        } finally {
            setIsLoading(false);
        }
    };

    // 初始化自動讀取資料
    useEffect(() => {
        fetchScenarios();
    }, []);

    // 1. 文字替換引擎
    const processTemplate = (text) => {
        if (!text) return "";
        return text
            .replace(/{shop_name}/g, params.shop_name)
            .replace(/{user_name}/g, params.user_name)
            .replace(/{product_name}/g, params.product_name);
    };

    // 2. 播放情境引擎 (模擬延遲)
    const playScenario = async (scenarioMessages) => {
        if (isPlaying) return;
        setIsPlaying(true);

        for (let msgData of scenarioMessages) {
            // 等待 Delay
            if (msgData.delay > 0) {
                await new Promise(resolve => setTimeout(resolve, msgData.delay));
            }

            // 替換文字
            const processedText = processTemplate(msgData.text);

            // 推送訊息
            const newMessage = {
                id: Date.now() + Math.random(),
                text: processedText,
                timeLabel: msgData.timeLabel || 'Just now',
            };

            setMessages(prev => [...prev, newMessage]);
        }
        setIsPlaying(false);
    };

    // 3. 自動捲動 Effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans text-gray-800">

            {/* === 左側控制區 === */}
            <div className="w-full md:w-96 bg-white shadow-lg z-10 flex flex-col border-r border-gray-200">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h1 className="text-xl font-bold flex items-center gap-2 text-slate-700">
                        <Settings className="w-6 h-6" /> LINE OA訊息模擬器
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* 1. 參數輸入區 */}
                    <section className="space-y-3">
                        <h2 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <User className="w-4 h-4" /> 設定參數
                        </h2>
                        {/* 這裡利用 Object.keys 快速產生輸入框 */}
                        {['shop_name', 'user_name', 'product_name'].map(key => (
                            <div key={key}>
                                <label className="text-xs text-gray-500 mb-1 block">{key}</label>
                                <input
                                    type="text"
                                    value={params[key]}
                                    onChange={(e) => setParams({ ...params, [key]: e.target.value })}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        ))}
                    </section>

                    <hr />

                    {/* 2. 情境按鈕區 */}
                    <section className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xs font-bold text-gray-400 uppercase">情境列表</h2>
                            <button onClick={fetchScenarios} disabled={isLoading} className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
                                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> 重整
                            </button>
                        </div>

                        <div className="grid gap-2">
                            {/* 分組邏輯 */}
                            {(() => {
                                const grouped = scenarios.reduce((acc, item) => {
                                    const cat = item.category || '未分類';
                                    if (!acc[cat]) acc[cat] = [];
                                    acc[cat].push(item);
                                    return acc;
                                }, {});

                                return Object.entries(grouped).map(([category, items]) => (
                                    <AccordionCategory key={category} title={category}>
                                        {items.map((scenario) => (
                                            <button
                                                key={scenario.id}
                                                onClick={() => playScenario(scenario.messages)}
                                                disabled={isPlaying}
                                                className="w-full text-left p-2 pl-4 border-l-2 border-slate-200 hover:border-blue-500 hover:bg-slate-50 transition-all flex justify-between group rounded-r text-sm"
                                            >
                                                <span className="font-medium text-gray-700">{scenario.label}</span>
                                                <Play className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500" />
                                            </button>
                                        ))}
                                    </AccordionCategory>
                                ));
                            })()}

                            {scenarios.length === 0 && <div className="text-xs text-gray-400 text-center py-4">正在載入情境列表...</div>}
                        </div>
                    </section>
                </div>

                {/* 底部清除按鈕 */}
                <div className="p-4 border-t bg-gray-50">
                    <button onClick={() => setMessages([])} className="w-full flex justify-center items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded text-sm font-medium transition">
                        <Trash2 className="w-4 h-4" /> 清除聊天紀錄
                    </button>
                </div>
            </div>

            {/* === 右側 LINE 畫面 === */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="h-16 bg-slate-800/90 backdrop-blur text-white flex items-center px-6 shadow-md z-10 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="font-bold">LINE OA</span>
                    </div>
                    <div className="text-xs text-slate-300">{isPlaying ? '對方正在輸入...' : ''}</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-[#7494C0]">
                    <div className="max-w-3xl mx-auto space-y-4 pt-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className="flex gap-3 items-start animate-fade-in-up">
                                {/* 頭像 */}
                                <img src={OA_AVATAR} alt="OA" className="w-10 h-10 rounded-full border border-gray-300 bg-white mt-1 object-cover" />

                                <div className="flex flex-col max-w-[75%]">
                                    <span className="text-[10px] text-white mb-1 ml-1">{params.shop_name}</span>
                                    <div className="flex items-end gap-2">
                                        {/* 氣泡與尖角 CSS */}
                                        <div className="relative bg-white text-gray-800 px-4 py-3 rounded-xl rounded-tl-none shadow-sm text-sm whitespace-pre-wrap">
                                            <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent"></div>
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] text-white/80 min-w-[30px] mb-1">{msg.timeLabel}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LineSimulator;
