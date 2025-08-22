import React, { useState } from "react";

// 假資料
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

const tabs = [
  { key: "resident", label: "住戶資料" },
  { key: "staff", label: "管理人員" },
  { key: "visitor", label: "訪客紀錄" },
  { key: "fee", label: "管理費" },
  { key: "announcement", label: "社區公告" },
  { key: "activity", label: "活動時程" },
  { key: "repair", label: "報修申請" },
  { key: "maintenance", label: "保養紀錄" },
  { key: "qa", label: "客服問答" },
  { key: "meeting", label: "會議紀錄" },
  { key: "expenditure", label: "財務支出" },
  { key: "parcel", label: "信件包裹" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  return (
    <div style={{ maxWidth: 850, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>社區管理系統 Demo</h2>
      <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "8px 14px",
              border: "1px solid #1976d2",
              borderRadius: 6,
              background: activeTab === tab.key ? "#1976d2" : "#fff",
              color: activeTab === tab.key ? "#fff" : "#1976d2",
              cursor: "pointer",
              fontWeight: activeTab === tab.key ? "bold" : "normal"
            }}>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 24, background: "#fafcff" }}>
        {activeTab === "resident" && (
          <>
            <h3>住戶資料管理</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>姓名</th><th>房號</th><th>聯絡方式</th><th>車位</th><th>入住時間</th><th>家庭成員</th>
                </tr>
              </thead>
              <tbody>
                {demoResidents.map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.room}</td>
                    <td>{r.phone}</td>
                    <td>{r.car}</td>
                    <td>{r.moveIn}</td>
                    <td>{r.family}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeTab === "staff" && (
          <>
            <h3>管理人員</h3>
            <table className="table">
              <thead>
                <tr><th>姓名</th><th>職位</th><th>聯絡方式</th></tr>
              </thead>
              <tbody>
                {demoStaff.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.role}</td>
                    <td>{s.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16 }}>
              <b>角色設定 / 權限（Demo）</b><br />
              主委：全部功能<br />
              清潔人員：維修、報修、包裹
            </div>
          </>
        )}
        {activeTab === "visitor" && (
          <>
            <h3>訪客紀錄</h3>
            <table className="table">
              <thead>
                <tr><th>姓名</th><th>身分證</th><th>拜訪房號</th><th>進入時間</th><th>離開時間</th><th>備註</th></tr>
              </thead>
              <tbody>
                {demoVisitors.map(v => (
                  <tr key={v.id}>
                    <td>{v.name}</td>
                    <td>{v.idCard}</td>
                    <td>{v.room}</td>
                    <td>{v.in}</td>
                    <td>{v.out}</td>
                    <td>{v.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeTab === "fee" && (
          <>
            <h3>管理費</h3>
            <table className="table">
              <thead>
                <tr><th>房號</th><th>金額</th><th>到期日</th><th>已繳</th><th>發票號碼</th></tr>
              </thead>
              <tbody>
                {demoFees.map(f => (
                  <tr key={f.id}>
                    <td>{f.room}</td>
                    <td>{f.amount}</td>
                    <td>{f.due}</td>
                    <td>{f.paid ? "是" : "否"}</td>
                    <td>{f.invoice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeTab === "announcement" && (
          <>
            <h3>社區公告</h3>
            <table className="table">
              <thead>
                <tr><th>標題</th><th>內容</th><th>發布時間</th><th>發布人</th><th>附件</th></tr>
              </thead>
              <tbody>
                {demoAnnouncements.map(a => (
                  <tr key={a.id}>
                    <td>{a.title}</td>
                    <td>{a.content}</td>
                    <td>{a.time}</td>
                    <td>{a.author}</td>
                    <td>{a.attachment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeTab === "activity" && (
          <>
            <h3>社區活動時程</h3>
            <table className="table">
              <thead>
                <tr><th>活動名稱</th><th>時間</th><th>地點</th><th>報名方式</th><th>負責人</th></tr>
              </thead>
              <tbody>
                {demoActivities.map(a => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.time}</td>
                    <td>{a.location}</td>
                    <td>{a.signup}</td>
                    <td>{a.organizer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeTab === "repair" && (
          <>
            <h3>報修申請</h3>
            <table className="table">
              <thead>
                <tr><th>房號</th><th>項目</th><th>描述</th><th>申請時間</th><th>狀態</th><th>負責人</th></tr>
              </thead>
              <tbody>
                {demoRepairs.map(r => (
                  <tr key={r.id}>
                    <td>{r.room}</td>
                    <td>{r.item}</td>
                    <td>{r.desc}</td>
                    <td>{r.time}</td>
                    <td>{r.status}</td>
                    <td>{r.handler}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeTab === "maintenance" && (
          <>
            <h3>維修、保養紀錄</h3>
            <table className="table">
              <thead>
                <tr><th>設備名稱</th><th>保養項目</th><th>時間</th><th>負責人</th><th>花費</th><th>紀錄</th></tr>
              </thead>
              <tbody>
                {demoMaintenances.map(m => (
                  <tr key={m.id}>
                    <td>{m.equipment}</td>
                    <td>{m.item}</td>
                    <td>{m.time}</td>
                    <td>{m.handler}</td>
                    <td>{m.cost}</td>
                    <td>{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeTab === "qa" && (
          <>
            <h3>客服問答</h3>
            <table className="table">
              <thead>
                <tr><th>房號</th><th>問題</th><th>回覆</th><th>狀態</th><th>時間</th></tr>
              </thead>
              <tbody>
                {demoQA.map(q => (
                  <tr key={q.id}>
                    <td>{q.room}</td>
                    <td>{q.q}</td>
                    <td>{q.a}</td>
                    <td>{q.status}</td>
                    <td>{q.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeTab === "meeting" && (
          <>
            <h3>會議紀錄</h3>
            <table className="table">
              <thead>
                <tr><th>主題</th><th>時間</th><th>地點</th><th>參與人員</th><th>紀錄</th><th>決議事項</th></tr>
              </thead>
              <tbody>
                {demoMeetings.map(m => (
                  <tr key={m.id}>
                    <td>{m.topic}</td>
                    <td>{m.time}</td>
                    <td>{m.location}</td>
                    <td>{m.participants}</td>
                    <td>{m.record}</td>
                    <td>{m.resolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeTab === "expenditure" && (
          <>
            <h3>財務支出</h3>
            <table className="table">
              <thead>
                <tr><th>支出項目</th><th>金額</th><th>日期</th><th>用途</th><th>憑證</th></tr>
              </thead>
              <tbody>
                {demoExpenditures.map(e => (
                  <tr key={e.id}>
                    <td>{e.item}</td>
                    <td>{e.amount}</td>
                    <td>{e.date}</td>
                    <td>{e.purpose}</td>
                    <td>{e.proof}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeTab === "parcel" && (
          <>
            <h3>信件包裹管理</h3>
            <table className="table">
              <thead>
                <tr><th>收件人</th><th>房號</th><th>包裹編號</th><th>到達時間</th><th>領取狀態</th></tr>
              </thead>
              <tbody>
                {demoParcels.map(p => (
                  <tr key={p.id}>
                    <td>{p.receiver}</td>
                    <td>{p.room}</td>
                    <td>{p.code}</td>
                    <td>{p.arrival}</td>
                    <td>{p.received ? "已領取" : "未領取"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
