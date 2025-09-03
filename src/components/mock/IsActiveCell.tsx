import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hook";
import type { RootState } from "../../store";

export const IsActiveCell: React.FC = (params: any) => {

  const userId=useAppSelector((state:RootState)=>state.user.user?.id)

  const navigate=useNavigate()

  const now = new Date();
  const scheduleTime = new Date(params.data.scheduleMock);

  // Button should be clickable only if active AND schedule time has passed
  const canClick = params.value && now >= scheduleTime;

  return canClick ? (
    <button
      onClick={() => {
        navigate(`/dashboard/${userId}/create-question/${params.data.id}`)
      }}
      style={{
        padding: "4px 8px",
        borderRadius: "4px",
        color: "white",
        backgroundColor: "#3b82f6",
        fontSize: "12px",
        border: "none",
        cursor: "pointer",
      }}
    >
      Start Test
    </button>
  ) : (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: "4px",
        color: "white",
        backgroundColor: params.value ? "#f59e0b" : "#ef4444", // active but not started = orange, inactive = red
        fontSize: "12px",
      }}
    >
      {params.value ? "Active" : "Inactive"}
    </span>
  );
};
