// components/StakingDashboard.jsx
import Info from "./Infos";
import Candidates from "./Candidates";

export default function StakingDashboard() {
	return (
		<div className="max-w-screen-xl p-4 flex flex-col lg:flex-row h-full justify-start items-start font-titillium-web">
			<div className="flex flex-col justify-center items-center lg:mr-[100px] w-full lg:w-auto lg:h-[1056px]">
				<Info />
			</div>
			<div className="mt-8 w-full lg:min-w-[510px]">
				<Candidates />
			</div>
		</div>
	);
}
