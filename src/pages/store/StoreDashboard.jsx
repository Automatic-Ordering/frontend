import { Boxes, PackageSearch, Sparkles } from 'lucide-react'
import { Card } from '../../components/ui'
import { Header } from '../../components/layout'
import { useAuth } from '../../contexts/AuthContext'
export default function StoreDashboard() { const { user } = useAuth(); const name = user?.name || user?.storeName || '점포'; return <><Header title={`${name}님, 환영합니다`} description="오늘도 편리한 점포 운영을 시작해보세요." /><Card className="welcome-card"><div><span className="eyebrow">STORE OPERATIONS</span><h2>자동발주 시스템 준비 완료</h2><p>상품과 재고 데이터를 연결하면 더 편리한 점포 운영을 시작할 수 있습니다.</p></div><Sparkles size={70} /></Card><div className="feature-grid">{[['상품 관리', '상품 등록 및 판매 정보를 관리하는 기능입니다.', PackageSearch], ['재고 관리', '점포 재고 현황을 확인하는 기능입니다.', Boxes], ['자동발주', '판매량을 기반으로 발주를 자동화하는 기능입니다.', Sparkles]].map(([title, desc, Icon]) => <Card className="feature-card" key={title}><div className="feature-icon"><Icon size={22} /></div><h2>{title}</h2><p>{desc}</p><span className="coming">준비 중</span></Card>)}</div></> }
