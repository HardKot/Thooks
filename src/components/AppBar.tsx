import {ReactNode} from "react";

export interface AppBarProps {
  center: ReactNode
}

export function AppBar({ center }: Readonly<AppBarProps>) {
  return (
    <div style={{display: "flex", flexDirection: "column"}}>
      <div style={{ width: '30%' }}>
        <h1 className="text-2xl font-bold">Thooks</h1>
      </div>
      <div>
        {center}
      </div>
      <div>

      </div>
    </div>
  )
}
