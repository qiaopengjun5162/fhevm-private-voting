import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 投票参数
  const title = "My First Private Voting";
  const options = ["Option A", "Option B", "Option C"];
  const durationInMinutes = 120; // 投票持续120分钟，方便测试

  // 计算结束时间（当前时间 + 持续时间）
  const startTime = Math.floor(Date.now() / 1000); // 当前秒数
  const endTime = startTime + durationInMinutes * 60;

  const deployedVoting = await deploy("PrivateVoting", {
    from: deployer,
    args: [title, options, startTime, endTime],
    log: true,
  });

  console.log(`PrivateVoting contract deployed to: ${deployedVoting.address}`);
  console.log(`Voting title: ${title}`);
  console.log(`Voting options: ${options.join(", ")}`);
  console.log(`Start time: ${new Date(startTime * 1000).toLocaleString()}`);
  console.log(`End time: ${new Date(endTime * 1000).toLocaleString()}`);
};

export default func;
func.id = "deploy_private_voting";
func.tags = ["PrivateVoting"];
