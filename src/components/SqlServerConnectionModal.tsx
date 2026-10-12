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
  onPullData?: () => Promise<any>;
  onPushData?: () => Promise<any>;
  onInitSchema?: () => Promise<any>;
  onDeduplicate?: () => Promise<any>;
}

export const SqlServerConnectionModal: React.FC<SqlServerConnectionModalProps> = ({
  isOpen,
  onClose,
  isSqlConnected,
  serverInfo,
  onTestConnection,
  onPullData,
  onPushData,
  onInitSchema,
  onDeduplicate
}) => {
  const [serverHost, setServerHost] = useState('localhost');
  const [serverPort, setServerPort] = useState('1433');
  const [databaseName, setDatabaseName] = useState('RentalPropertyManagementDB');
  const [userName, setUserName] = useState('sa');
  const [password, setPassword] = useState('');
  const [encrypt, setEncrypt] = useState(false);

  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState<'pull' | 'push' | 'init' | 'dedup' | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTestResult(null);
    setSyncMessage(null);

    try {
      // Đăng nhập kết nối và tự động cập nhật CSDL luôn theo yêu cầu
      const res = await onTestConnection({
        server: serverHost,
        port: serverPort,
        database: databaseName,
        user: userName,
        password,
        encrypt,
        autoSync: true
      });
      setTestResult(res);
      if (res && res.connected) {
        setSyncMessage({
          type: 'success',
          text: res.syncResult?.message || 'Đăng nhập thành công và đã cập nhật toàn bộ dữ liệu vào CSDL!'
        });
      }
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

  const handleAction = async (action: 'pull' | 'push' | 'init' | 'dedup') => {
    setSyncLoading(action);
    setSyncMessage(null);
    try {
      let res: any;
      if (action === 'pull' && onPullData) {
        res = await onPullData();
      } else if (action === 'push' && onPushData) {
        res = await onPushData();
      } else if (action === 'init' && onInitSchema) {
        res = await onInitSchema();
      } else if (action === 'dedup' && onDeduplicate) {
        res = await onDeduplicate();
      }
      if (res && res.success) {
        setSyncMessage({ type: 'success', text: res.message || 'Thao tác thành công!' });
      } else {
        setSyncMessage({ type: 'error', text: res?.message || 'Thao tác thất bại.' });
      }
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: err?.message || 'Lỗi xử lý đồng bộ dữ liệu.' });
    } finally {
      setSyncLoading(null);
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>{loading ? 'Đang đăng nhập & cập nhật CSDL...' : '⚡ Đăng Nhập & Cập Nhật CSDL Ngay'}</span>
            </button>
          </div>
        </form>

        {/* Kết quả kiểm tra kết nối & tự động cập nhật CSDL */}
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
                  <span>ĐÃ ĐĂNG NHẬP VÀ CẬP NHẬT CSDL THÀNH CÔNG!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <span>KẾT NỐI KHÔNG THÀNH CÔNG</span>
                </>
              )}
            </div>

            <p>{testResult.message}</p>

            {testResult.connected && testResult.syncResult?.counts && (
              <div className="pt-2 border-t border-emerald-800/60 space-y-2">
                <div className="text-[11px] font-semibold text-emerald-300">
                  Số lượng bản ghi đã chuẩn hóa và cập nhật vào MS SQL Server (Đã loại bỏ trùng lặp):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-emerald-700/40">
                    <div className="text-emerald-400 font-bold text-sm">{testResult.syncResult.counts.users}</div>
                    <div className="text-[10px] text-slate-300">Tài khoản</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-emerald-700/40">
                    <div className="text-emerald-400 font-bold text-sm">{testResult.syncResult.counts.nodes}</div>
                    <div className="text-[10px] text-slate-300">Cây thực thể</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-emerald-700/40">
                    <div className="text-emerald-400 font-bold text-sm">{testResult.syncResult.counts.contracts}</div>
                    <div className="text-[10px] text-slate-300">Hợp đồng</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-emerald-700/40">
                    <div className="text-emerald-400 font-bold text-sm">{testResult.syncResult.counts.invoices}</div>
                    <div className="text-[10px] text-slate-300">Hóa đơn</div>
                  </div>
                </div>
              </div>
            )}

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

        {/* Khối Thao Tác Đồng Bộ Dữ Liệu Thực Tế Khi Đã Kết Nối */}
        {(isSqlConnected || testResult?.connected) && (
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-white text-xs">
                  Trung Tâm Đồng Bộ Dữ Liệu 2 Chiều & Khử Trùng Lặp CSDL
                </h4>
              </div>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono">
                TCP 1433 Sẵn Sàng
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Dữ liệu được cập nhật tự động ngay khi đăng nhập. Bạn cũng có thể thực hiện thủ công các thao tác bên dưới để đồng bộ dữ liệu hoặc dọn dẹp các bản ghi trùng lặp:
            </p>

            {/* Thông báo kết quả đồng bộ */}
            {syncMessage && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                syncMessage.type === 'success' 
                  ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200' 
                  : 'bg-rose-950/80 border border-rose-500 text-rose-200'
              }`}>
                {syncMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                <span>{syncMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
              {/* Nút 1: Đẩy dữ liệu lên & khử trùng */}
              <button
                type="button"
                disabled={syncLoading !== null}
                onClick={() => handleAction('push')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 text-left transition-all disabled:opacity-50 group"
              >
                <div className="flex items-center gap-2 font-bold text-blue-400 text-xs mb-1">
                  {syncLoading === 'push' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>📤</span>}
                  <span>Cập Nhật Lên SQL</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Lưu các phòng trọ, tài khoản và cây phân cấp vào CSDL (tự động khử trùng lặp).
                </div>
              </button>

              {/* Nút 2: Kéo dữ liệu về */}
              <button
                type="button"
                disabled={syncLoading !== null}
                onClick={() => handleAction('pull')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-left transition-all disabled:opacity-50 group"
              >
                <div className="flex items-center gap-2 font-bold text-cyan-400 text-xs mb-1">
                  {syncLoading === 'pull' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>📥</span>}
                  <span>Tải Dữ Liệu Về Web</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Đọc toàn bộ phòng, tòa nhà, hợp đồng từ bảng SQL Server nạp vào giao diện.
                </div>
              </button>

              {/* Nút 3: Khử trùng lặp CSDL */}
              <button
                type="button"
                disabled={syncLoading !== null}
                onClick={() => handleAction('dedup')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-600/40 hover:border-emerald-500 text-left transition-all disabled:opacity-50 group"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs mb-1">
                  {syncLoading === 'dedup' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Khử Trùng Lặp CSDL</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Quét và dọn sạch các bản ghi bị trùng mã NodeCode, CCCD hoặc SĐT trong CSDL.
                </div>
              </button>

              {/* Nút 4: Khởi tạo schema & seed data */}
              <button
                type="button"
                disabled={syncLoading !== null}
                onClick={() => handleAction('init')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-600/40 hover:border-amber-500 text-left transition-all disabled:opacity-50 group"
              >
                <div className="flex items-center gap-2 font-bold text-amber-400 text-xs mb-1">
                  {syncLoading === 'init' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>Khởi Tạo CSDL Mẫu</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Chạy script tạo bảng và nạp dữ liệu mẫu chuẩn hóa không trùng lặp.
                </div>
              </button>
            </div>
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
