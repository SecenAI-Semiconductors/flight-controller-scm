import StoreHeader from "./StoreHeader";
import "../../styles/components/store-layout.css";

export default function StoreLayout({ children }) {
  return (
    <div className="store-layout">
      <StoreHeader />
      <main className="store-layout__main">{children}</main>
    </div>
  );
}
