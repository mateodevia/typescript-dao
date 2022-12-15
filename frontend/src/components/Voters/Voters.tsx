import React, { useEffect, useState } from "react";
import { colors } from "../../styles/globals";
import { PieChart, Pie, Tooltip } from "recharts";
import { getVoters } from "../../api/users";
import { EthersContext } from "../../App";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store";
import { votersUpdate } from "../../reducers/voters";
import { useWindowSize } from "../../utils/useWindowSize";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Avatar from "@mui/material/Avatar";
import Identicon from "identicon.js";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card sx={{ m: 2, borderRadius: "10px" }}>
        <CardHeader
          avatar={
            <Avatar
              src={`data:image/png;base64,${new Identicon(
                payload[0].name,
                30
              ).toString()}`}
            ></Avatar>
          }
          title={payload[0].name}
          subheader={`Has x tokens`}
        />
      </Card>
    );
  }
  return <div></div>;
};

const RADIAN = Math.PI / 180;
const CustomLabel = (element: any) => {
  const { cx, cy, midAngle, outerRadius } = element;
  const radius = outerRadius * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN) * 2.5;
  const y = cy + radius * Math.sin(-midAngle * RADIAN) * 2.5;
  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={colors.primary}>
        Voting Power
      </text>
      <foreignObject x={x - 20} y={y - 20} height="50" width="50">
        <img
          src={`data:image/png;base64,${new Identicon(
            element.name,
            30
          ).toString()}`}
          alt={element.name}
          width="40px"
          height="40px"
          style={{ borderRadius: "50%" }}
        />
      </foreignObject>
    </g>
  );
};

export function Voters() {
  const { contracts } = React.useContext(EthersContext);
  const size = useWindowSize();

  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );

  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    fetchVoters();
  }, []);

  // Null safety if EthersContext is not is not available
  if (!contracts) return <div></div>;

  const fetchVoters = async () => {
    const voters = await getVoters(contracts);
    dispatch(votersUpdate(voters));
    setChartData(voters.map((v) => ({ name: v, value: 20 })));
  };

  return (
    <>
      <h2 style={{ textAlign: "center", color: colors.primary }}>
        Get to know our voters
      </h2>
      {/* width is 100% - 6vw of margin set by the card */}
      <PieChart width={size.width * 0.94} height={300}>
        <Pie
          dataKey="value"
          isAnimationActive={true}
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          fill={colors.accent}
          labelLine={false}
          label={CustomLabel}
        />
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </>
  );
}
