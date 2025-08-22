import React, { useEffect, useState } from "react";

/* ===== Demo 資料（原樣保留） ===== */
const demoResidents = [
  { id: 1, name: "王大明", room: "A101", phone: "0912-345678", car: "ABC-1234", moveIn: "2021-09-01", family: "王太太、王小明" },
  { id: 2, name: "林小美", room: "A102", phone: "0922-222222", car: "XYZ-5678", moveIn: "2023-06-15", family: "林爸爸、林媽媽" },
];
const demoStaff = [
  { id: 1, name: "李主委", role: "主委", phone: "0933-111111" },
  { id: 2, name: "陳清潔", role: "清潔人員", phone: "0933-222222" },
];
const demoVisitors = [
  { id: 1, name: "陳訪客", idCard: "A123456789", room: "A101", in: "2025-08-22 10:00", out: "2025-08-22 11:00", note: "送文件" },
];
const demoFees = [
  { id: 1, room: "A101", amount: 1200, due: "2025-09-10", paid: true, invoice: "INV20250801" },
  { id: 2, room: "A102", amount: 1200, due: "2025-09-10", paid: false, invoice: "INV20250802" },
];
const demoAnnouncements = [
  { id: 1, title: "停水通知", content: "8/25上午9~12點停水。", time: "2025-08-20", author: "李主委", attachment: "" },
];
const demoActivities = [
  { id: 1, name: "中秋烤肉", time: "2025-09-15 18:00", location: "中庭", signup: "現場報名", organizer: "王大明" },
];
const demoRepairs = [
  { id: 1, room: "A101", item: "水龍頭漏水", desc: "廚房水龍頭持續滴水", time: "2025-08-21", status: "處理中", handler: "陳清潔" },
];
const demoMaintenances = [
  { id: 1, equipment: "電梯", item: "年度保養", time: "2025-08-10", handler: "保養公司", cost: 8000, note: "正常" },
];
const demoQA = [
  { id: 1, room: "A101", q: "垃圾怎麼分類？", a: "請依公告分類", status: "已回覆", time: "2025-08-19" },
];
const demoMeetings = [
  { id: 1, topic: "財務審查", time: "2025-08-18", location: "會議室", participants: "主委、住戶代表", record: "討論收支", resolution: "通過" },
];
const demoExpenditures = [
  { id: 1, item: "清潔用品", amount: 1500, date: "2025-08-12", purpose: "大樓清潔", proof: "收據" },
];
const demoParcels = [
  { id: 1, receiver: "王大明", room: "A101", code: "PKG12345", arrival: "2025-08-21 14:00", received: true },
];

/** ===== 首頁卡片（標題與條列）＋每張卡的背景圖 =====
 * 將 bg 傳成任意網址或 public/xxx.jpg
 */
const featureCards = [
  {
    key: "resident",
    title: "智慧社區管理",
    items: ["大樓管理費", "社區公告", "訪客管理", "公設預約", "點餐系統", "規約辦法", "資產管理"],
    bg: "https://images.unsplash.com/photo-1581091215367-59ab6b3d6321?q=80&w=1600&auto=format&fit=crop",
  },
  {
    key: "staff",
    title: "大樓對講機系統",
    items: ["手機遠端開門", "緊急求救", "自動轉接市話"],
    bg: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop",
  },
  {
    key: "parcel",
    title: "社區包裹管理",
    items: ["郵務管理", "寄放物品", "社區智慧包裹櫃"],
    bg: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=1600&auto=format&fit=crop",
  },
  {
    key: "expenditure",
    title: "電動車充電樁",
    items: ["EMS能源管理系統", "充電樁硬體", "社區充電樁講座"],
    bg: "https://images.unsplash.com/photo-1617727553252-65863c156eb0?q=80&w=1600&auto=format&fit=crop",
  },
  {
    key: "announcement",
    title: "智慧社區溝通",
    items: ["個人通知", "行事曆", "瓦斯抄表", "區權大會", "住戶意見反映"],
    bg: "https://images.unsplash.com/photo-1529336953121-ad5a0d43d0d2?q=80&w=1600&auto=format&fit=crop",
  },
  {
    key: "fee",
    title: "物業管理系統",
    items: ["物業雲整合管理平台"],
    bg: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop",
  },
  {
    key: "maintenance",
    title: "智慧建築標章",
    items: ["審查取分", "BA系統整合", "標章驗收"],
    bg: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1600&auto=format&fit=crop",
  },
  {
    key: "activity",
    title: "社區參與",
    items: ["智募集", "快問快答", "社區團購"],
    bg: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1600&auto=format&fit=crop",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(null); // null=首頁卡片, 其他=分頁內容
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // 顯示 / 隱藏回到頂部
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="container py-5">
      {/* 頁首 */}
      <div className="text-center mb-5">
        <h2 className="fw-bold display-6 mb-3">智慧生活產品與服務</h2>
        <p className="text-muted">
          智生活打造全台最大的智慧社區管理平台與智慧 AIoT 科技應用，可用手機、平板或電腦設備進行雲端智慧化管理。
          即時掌控社區全方位衣、食、住、行、育、樂等面向。
        </p>
      </div>

      {/* 首頁卡片（與你提供的版型一致：半透明綠色、圓角、陰影、背景圖） */}
      {!activeTab && (
        <>
          <div className="row g-4">
            {featureCards.map((card) => (
              <div className="col-12 col-md-6 col-lg-3" key={card.key}>
                <button
                  type="button"
                  onClick={() => setActiveTab(card.key)}
                  className="tile w-100 text-start"
                  style={{ backgroundImage: `url(${card.bg})` }}
                >
                  <div className="tile-overlay" />
                  <div className="position-relative">
                    <div className="h3 fw-bolder mb-3">{card.title}</div>
                    <div className="tile-items">
                      {card.items.map((t, i) => (
                        <span key={i}>
                          {t}
                          {i !== card.items.length - 1 && <span className="mx-2">｜</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* 右側浮球：免費諮詢 */}
          <button
            className="consult-fab"
            onClick={() => alert("這裡可連到你的表單 / Line / 電話")}
            aria-label="免費諮詢"
          >
            免費<br />諮詢
          </button>

          {/* 回到頂部 */}
          {showTop && (
            <button className="to-top-fab" onClick={scrollToTop} aria-label="回到頂部">
              <span className="fs-4">▲</span>
            </button>
          )}

          {/* 樣式（僅此頁使用） */}
          <style>{`
            .tile{
              position:relative;
              display:block;
              border:0;
              border-radius: 18px;
              padding: 28px;
              min-height: 200px;
              background-size: cover;
              background-position: center;
              overflow:hidden;
              color:#fff;
              text-shadow: 0 1px 2px rgba(0,0,0,.25);
              box-shadow: 0 10px 24px rgba(0,0,0,.08);
              cursor:pointer;
              transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
            }
            .tile:hover{
              transform: translateY(-2px);
              box-shadow: 0 16px 36px rgba(0,0,0,.14);
              filter: saturate(1.05);
            }
            .tile-overlay{
              position:absolute; inset:0;
              background: rgba(0,163,153,.88); /* 和圖片相同的綠色調 */
            }
            .tile-items{ line-height:1.9; font-weight:600; opacity:.98; }
            @media (max-width:576px){
              .tile{ min-height: 170px; padding: 22px; }
            }

            .consult-fab{
              position: fixed;
              right: 18px;
              bottom: 120px;
              width: 64px; height: 64px;
              border-radius: 999px;
              border:0;
              background:#ff8a3d;
              color:#fff;
              font-weight: 800;
              line-height: 1.1;
              box-shadow: 0 10px 24px rgba(0,0,0,.2);
              z-index: 1050;
            }
            .consult-fab:hover{ filter: brightness(1.05); }

            .to-top-fab{
              position: fixed;
              right: 22px;
              bottom: 40px;
              width: 56px; height: 56px;
              border-radius: 999px;
              border:0;
              background:#4d4d4d;
              color:#fff;
              box-shadow: 0 10px 24px rgba(0,0,0,.2);
              z-index: 1050;
            }
            .to-top-fab:hover{ filter: brightness(1.1); }
          `}</style>
        </>
      )}

      {/* 內頁內容（沿用你原本每個 tab 的表格）＋ 返回總覽 */}
      {activeTab && (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h3 className="mb-0">
                {{
                  resident: "住戶資料管理",
                  staff: "管理人員",
                  visitor: "訪客紀錄",
                  fee: "管理費",
                  announcement: "社區公告",
                  activity: "社區活動時程",
                  repair: "報修申請",
                  maintenance: "維修、保養紀錄",
                  qa: "客服問答",
                  meeting: "會議紀錄",
                  expenditure: "財務支出",
                  parcel: "信件包裹管理",
                }[activeTab] || "詳情"}
              </h3>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setActiveTab(null)}>
                ← 返回總覽
              </button>
            </div>

            {activeTab === "resident" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-primary">
                    <tr>
                      <th>姓名</th><th>房號</th><th>聯絡方式</th><th>車位</th><th>入住時間</th><th>家庭成員</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoResidents.map(r => (
                      <tr key={r.id}>
                        <td>{r.name}</td><td>{r.room}</td><td>{r.phone}</td><td>{r.car}</td><td>{r.moveIn}</td><td>{r.family}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "staff" && (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-info">
                      <tr><th>姓名</th><th>職位</th><th>聯絡方式</th></tr>
                    </thead>
                    <tbody>
                      {demoStaff.map(s => (
                        <tr key={s.id}>
                          <td>{s.name}</td><td>{s.role}</td><td>{s.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 small text-muted">
                  <b>角色 / 權限（Demo）</b>：主委可用全部功能；清潔人員限維修、報修、包裹。
                </div>
              </>
            )}

            {activeTab === "visitor" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-secondary">
                    <tr><th>姓名</th><th>身分證</th><th>拜訪房號</th><th>進入時間</th><th>離開時間</th><th>備註</th></tr>
                  </thead>
                  <tbody>
                    {demoVisitors.map(v => (
                      <tr key={v.id}>
                        <td>{v.name}</td><td>{v.idCard}</td><td>{v.room}</td><td>{v.in}</td><td>{v.out}</td><td>{v.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "fee" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-warning">
                    <tr><th>房號</th><th>金額</th><th>到期日</th><th>已繳</th><th>發票號碼</th></tr>
                  </thead>
                  <tbody>
                    {demoFees.map(f => (
                      <tr key={f.id}>
                        <td>{f.room}</td><td>{f.amount}</td><td>{f.due}</td><td>{f.paid ? "是" : "否"}</td><td>{f.invoice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "announcement" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-success">
                    <tr><th>標題</th><th>內容</th><th>發布時間</th><th>發布人</th><th>附件</th></tr>
                  </thead>
                  <tbody>
                    {demoAnnouncements.map(a => (
                      <tr key={a.id}>
                        <td>{a.title}</td><td>{a.content}</td><td>{a.time}</td><td>{a.author}</td><td>{a.attachment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-success">
                    <tr><th>活動名稱</th><th>時間</th><th>地點</th><th>報名方式</th><th>負責人</th></tr>
                  </thead>
                  <tbody>
                    {demoActivities.map(a => (
                      <tr key={a.id}>
                        <td>{a.name}</td><td>{a.time}</td><td>{a.location}</td><td>{a.signup}</td><td>{a.organizer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "repair" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-danger">
                    <tr><th>房號</th><th>項目</th><th>描述</th><th>申請時間</th><th>狀態</th><th>負責人</th></tr>
                  </thead>
                  <tbody>
                    {demoRepairs.map(r => (
                      <tr key={r.id}>
                        <td>{r.room}</td><td>{r.item}</td><td>{r.desc}</td><td>{r.time}</td><td>{r.status}</td><td>{r.handler}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "maintenance" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-info">
                    <tr><th>設備名稱</th><th>保養項目</th><th>時間</th><th>負責人</th><th>花費</th><th>紀錄</th></tr>
                  </thead>
                  <tbody>
                    {demoMaintenances.map(m => (
                      <tr key={m.id}>
                        <td>{m.equipment}</td><td>{m.item}</td><td>{m.time}</td><td>{m.handler}</td><td>{m.cost}</td><td>{m.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "qa" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-info">
                    <tr><th>房號</th><th>問題</th><th>回覆</th><th>狀態</th><th>時間</th></tr>
                  </thead>
                  <tbody>
                    {demoQA.map(q => (
                      <tr key={q.id}>
                        <td>{q.room}</td><td>{q.q}</td><td>{q.a}</td><td>{q.status}</td><td>{q.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "meeting" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-info">
                    <tr><th>主題</th><th>時間</th><th>地點</th><th>參與人員</th><th>紀錄</th><th>決議事項</th></tr>
                  </thead>
                  <tbody>
                    {demoMeetings.map(m => (
                      <tr key={m.id}>
                        <td>{m.topic}</td><td>{m.time}</td><td>{m.location}</td><td>{m.participants}</td><td>{m.record}</td><td>{m.resolution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "expenditure" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-warning">
                    <tr><th>支出項目</th><th>金額</th><th>日期</th><th>用途</th><th>憑證</th></tr>
                  </thead>
                  <tbody>
                    {demoExpenditures.map(e => (
                      <tr key={e.id}>
                        <td>{e.item}</td><td>{e.amount}</td><td>{e.date}</td><td>{e.purpose}</td><td>{e.proof}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "parcel" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-secondary">
                    <tr><th>收件人</th><th>房號</th><th>包裹編號</th><th>到達時間</th><th>領取狀態</th></tr>
                  </thead>
                  <tbody>
                    {demoParcels.map(p => (
                      <tr key={p.id}>
                        <td>{p.receiver}</td><td>{p.room}</td><td>{p.code}</td><td>{p.arrival}</td><td>{p.received ? "已領取" : "未領取"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
