import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const title = "Community Governance Vote #1";
  const options = ["Yes, approve", "No, reject", "Abstain"];
  const durationInDays = 2;

  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + durationInDays * 24 * 60 * 60;

  const deployedVoting = await deploy("PrivateVotingV2", {
    from: deployer,
    args: [title, options, startTime, endTime],
    log: true,
  });

  console.log(`PrivateVotingV2 deployed to: ${deployedVoting.address}`);
  console.log(`Title: ${title}`);
  console.log(`Options: ${options.join(", ")}`);
  console.log(`Start: ${new Date(startTime * 1000).toLocaleString()}`);
  console.log(`End: ${new Date(endTime * 1000).toLocaleString()}`);
  console.log(`Duration: ${durationInDays} days`);
};

export default func;
func.id = "deploy_private_voting_v2";
func.tags = ["PrivateVotingV2"];
