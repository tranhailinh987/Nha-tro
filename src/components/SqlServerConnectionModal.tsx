import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  KeyRound, 
  Layers, 
  TableProperties, 
  Wrench, 
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';

interface SqlServerConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSqlConnected: boolean;
  serverInfo: any;
  onTestConnection: (config: any) => Promise<any>;
}

export const SqlServerConnectionModal: React.FC<SqlServerConnectionModalProps> = ({
  isOpen,
  onClose,
  isSqlConnected,
  serverInfo,
  onTestConnection
}) => {
  const [serverHost, setServerHost] = useState('localhost');
  const [serverPort, setServerPort] = useState('1433');
  const [databaseName, setDatabaseName] = useState('RentalPropertyManagementDB');
  const [userName, setUserName] = useState('sa');
  const [password, setPassword] = useState('');
  const [encrypt, setEncrypt] = useState(false);

  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTestResult(null);

    try {
      const res = await onTestConnection({
        server: serverHost,
        port: serverPort,
        database: databaseName,
        user: userName,
        password,
        encrypt
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        connected: false,
        message: err?.message || 'Lỗi khi gọi API kiểm tra kết nối SQL Server.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Trung Tâm Kết Nối MS SQL Server (MS SQL Server Express)
              </h3>
              <p className="text-xs text-slate-400">
                Cấu hình & kiểm tra kết nối CSDL thực tế giữa ứng dụng và máy chủ SQL Server
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        {/* Giải thích kiến trúc kỹ thuật */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
          <div className="font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            Kiến trúc Kết Nối: Trình duyệt &rarr; Node.js Backend API (`server.ts` + `mssql`) &rarr; MS SQL Server (Cổng 1433)
          </div>
          <p className="text-slate-400 leading-relaxed">
            Trình duyệt web vì lý do bảo mật không thể mở kết nối TCP trực tiếp tới cổng 1433 của MS SQL Server. 
            Do đó, ứng dụng sử dụng máy chủ backend Node.js (với thư viện chính thức <code>mssql / tedious</code>) làm cầu nối trung chuyển dữ liệu an toàn.
          </p>
        </div>

        {/* Form cấu hình kết nối */}
        <form onSubmit={handleTest} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Máy chủ SQL Server (Host / IP):</label>
              <input
                type="text"
                value={serverHost}
                onChange={(e) => setServerHost(e.target.value)}
                placeholder="localhost hoặc 127.0.0.1 hoặc IP máy chủ"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-cyan-500"
                required
              />
              <span className="text-[10px] text-slate-500">Mặc định: localhost hoặc IP mạng LAN/VPS</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Cổng kết nối (TCP Port):</label>
              <input
                type="text"
                value={serverPort}
                onChange={(e) => setServerPort(e.target.value)}
                placeholder="1433"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-cyan-500"
                required
              />
              <span className="text-[10px] text-slate-500">Cổng chuẩn của MS SQL Server: 1433</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Tên Database:</label>
              <input
                type="text"
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
                placeholder="RentalPropertyManagementDB"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Tài khoản (SQL User):</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="sa"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 mb-1 font-medium">Mật khẩu (Password):</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu của tài khoản sa trên SQL Server..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="encryptToggle"
              checked={encrypt}
              onChange={(e) => setEncrypt(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800"
            />
            <label htmlFor="encryptToggle" className="text-slate-300 text-xs">
              Mã hóa kết nối (Encrypt = true - chỉ bật khi dùng Azure SQL hoặc có SSL certificate)
            </label>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isSqlConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-slate-400">
                Trạng thái: <strong className={isSqlConnected ? 'text-emerald-400' : 'text-slate-400'}>
                  {isSqlConnected ? 'Đã kết nối MS SQL Server' : 'Chưa kết nối'}
                </strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>{loading ? 'Đang kiểm tra kết nối...' : 'Kiểm Tra Kết Nối (Test)'}</span>
            </button>
          </div>
        </form>

        {/* Kết quả kiểm tra kết nối */}
        {testResult && (
          <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
            testResult.connected 
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' 
              : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              {testResult.connected ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>KẾT NỐI MS SQL SERVER THÀNH CÔNG!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <span>KẾT NỐI KHÔNG THÀNH CÔNG</span>
                </>
              )}
            </div>

            <p>{testResult.message}</p>

            {testResult.connected && testResult.serverInfo && (
              <div className="pt-2 border-t border-emerald-800/60 space-y-1.5 text-[11px] text-slate-300 font-mono">
                <div>Máy chủ: <strong className="text-white">{testResult.serverInfo.server}:{testResult.serverInfo.port}</strong></div>
                <div>CSDL: <strong className="text-white">{testResult.serverInfo.databaseName}</strong></div>
                <div>Thời gian máy chủ: <strong className="text-white">{testResult.serverInfo.serverTime}</strong></div>
                <div>Số lượng bảng hiện có: <strong className="text-emerald-400 font-bold">{testResult.serverInfo.tableCount} bảng</strong></div>
                {testResult.serverInfo.tables && testResult.serverInfo.tables.length > 0 && (
                  <div>
                    Danh sách bảng trong CSDL: <span className="text-cyan-300">{testResult.serverInfo.tables.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {!testResult.connected && testResult.errorDetails?.hint && (
              <div className="pt-2 border-t border-rose-800/60 text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" /> Hướng dẫn khắc phục trên SQL Server Express:
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                  {testResult.errorDetails.hint}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3 Bước Kích Hoạt SQL Server Express Trên Máy Của Bạn */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-white flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            3 Bước bật kết nối TCP/IP cho MS SQL Server Express (Nếu chạy cục bộ trên máy):
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
            <li>
              Mở <strong>SQL Server Configuration Manager</strong> &rarr; Chọn <strong>SQL Server Network Configuration</strong> &rarr; Bấm <strong>Protocols for SQLEXPRESS</strong> &rarr; Đổi <strong>TCP/IP</strong> thành <strong>Enabled</strong>.
            </li>
            <li>
              Nháy đúp vào <strong>TCP/IP</strong> &rarr; Sang tab <strong>IP Addresses</strong> &rarr; Kéo xuống dưới cùng tại mục <strong>IPAll</strong> &rarr; Điền <strong>TCP Port = 1433</strong> &rarr; Bấm OK.
            </li>
            <li>
              Chọn mục <strong>SQL Server Services</strong> &rarr; Chuột phải vào <strong>SQL Server (SQLEXPRESS)</strong> &rarr; Bấm <strong>Restart</strong>.
            </li>
          </ol>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
