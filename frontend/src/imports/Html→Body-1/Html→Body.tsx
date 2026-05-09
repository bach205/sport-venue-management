import svgPaths from "./svg-yaf5l5ryvr";
import imgAvatar from "./244cc22520475607918c3b4e0806b6cd19231fd4.png";
import imgAvatar1 from "./645afd4622828474bb4e9ef463fb4c50c41757a9.png";
import imgAvatar2 from "./85f2b1fcf9fbde97cb43de566e1fc58d7dc5f9a2.png";
import imgAvatar3 from "./a0f2df621eb14a30acc7eee63a30e2de7f9d53d6.png";
import imgCourtPreview from "./c1c6d62b4135dfdd55aafefa06abfdf8321f96cf.png";
import imgAvatar4 from "./95f383dad4232d71e1e9fb7cf04dfe3fdab3bd30.png";
import imgAvatar5 from "./fd7d6df8e21abbc14fed92d1c6e27538c3dd4979.png";
import imgSarahJenkins from "./768be8c6c602934c7f4f0c51ce322a03d7bc3607.png";

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Lexend:ExtraBold',sans-serif] font-extrabold justify-center leading-[0] relative shrink-0 text-[#a04100] text-[24px] tracking-[-0.6px] whitespace-nowrap">
        <p className="leading-[32px]">Matchill</p>
      </div>
    </div>
  );
}

function Link() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="Link">
      <div className="flex flex-col font-['Lexend:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#584238] text-[18px] whitespace-nowrap">
        <p className="leading-[28px]">Home</p>
      </div>
    </div>
  );
}

function Link1() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="Link">
      <div className="flex flex-col font-['Lexend:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#584238] text-[18px] whitespace-nowrap">
        <p className="leading-[28px]">Explore</p>
      </div>
    </div>
  );
}

function Link2() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="Link">
      <div className="flex flex-col font-['Lexend:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#584238] text-[18px] whitespace-nowrap">
        <p className="leading-[28px]">Venues</p>
      </div>
    </div>
  );
}

function Link3() {
  return (
    <div className="relative self-stretch shrink-0" data-name="Link">
      <div aria-hidden="true" className="absolute border-[#a04100] border-b-2 border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col items-start pb-[6px] relative size-full">
        <div className="flex flex-col font-['Lexend:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#a04100] text-[18px] whitespace-nowrap">
          <p className="leading-[28px]">Community</p>
        </div>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <div className="content-stretch flex gap-[16px] h-[34px] items-start relative shrink-0" data-name="Nav">
      <Link />
      <Link1 />
      <Link2 />
      <Link3 />
    </div>
  );
}

function Container() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[24px] items-center relative size-full">
        <Container1 />
        <Nav />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[20px] relative shrink-0 w-[16px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
        <g id="Container">
          <path d={svgPaths.p164b49c0} fill="var(--fill-0, #584238)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[8px] relative rounded-[9999px] shrink-0" data-name="Button">
      <Container3 />
    </div>
  );
}

function Container4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Container">
          <path d={svgPaths.p85bff00} fill="var(--fill-0, #584238)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[8px] relative rounded-[9999px] shrink-0" data-name="Button">
      <Container4 />
    </div>
  );
}

function Container2() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[15.99px] items-center relative size-full">
        <Button />
        <Button1 />
      </div>
    </div>
  );
}

function HeaderTopAppBarSemanticShell() {
  return (
    <div className="bg-[#fff8f6] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative shrink-0 w-full z-[2]" data-name="Header - TopAppBar Semantic Shell">
      <div aria-hidden="true" className="absolute border-[#dfc0b3] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between pb-[17px] pt-[16px] px-[24px] relative size-full">
          <Container />
          <Container2 />
        </div>
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative" data-name="Heading 1">
      <div className="flex flex-col font-['Lexend:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#241914] text-[24px] w-full">
        <p className="leading-[32px]">Messages</p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Heading />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-[rgba(88,66,56,0.7)] w-full">
          <p className="leading-[normal]">Search people, groups...</p>
        </div>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#fff1eb] relative rounded-[9999px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-start justify-center pl-[41px] pr-[17px] py-[13px] relative size-full">
          <Container7 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#dfc0b3] border-solid inset-0 pointer-events-none rounded-[9999px]" />
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute bottom-[23.91%] content-stretch flex flex-col items-start left-[12px] top-[23.91%]" data-name="Container">
      <div className="relative shrink-0 size-[18px]" data-name="Icon">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
          <path d={svgPaths.p8a35e00} fill="var(--fill-0, #584238)" id="Icon" />
        </svg>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Input />
        <Container8 />
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#fff8f6] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex-[1_0_0] min-w-px relative rounded-[4px]" data-name="Button">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[12px] py-[6px] relative size-full">
          <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#a04100] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[20px]">All</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="flex-[1_0_0] min-w-px relative rounded-[4px]" data-name="Button">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[12px] py-[6px] relative size-full">
          <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#584238] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[20px]">1-1</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="flex-[1_0_0] min-w-px relative rounded-[4px]" data-name="Button">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[12px] py-[6px] relative size-full">
          <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#584238] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[20px]">Groups</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tabs() {
  return (
    <div className="bg-[#fff1eb] relative rounded-[8px] shrink-0 w-full" data-name="Tabs">
      <div className="flex flex-row justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-start justify-center p-[4px] relative size-full">
          <Button2 />
          <Button3 />
          <Button4 />
        </div>
      </div>
    </div>
  );
}

function ListHeaderSearch() {
  return (
    <div className="bg-[#fff8f6] relative shrink-0 w-full" data-name="List Header & Search">
      <div aria-hidden="true" className="absolute border-[#dfc0b3] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start pb-[17px] pt-[16px] px-[16px] relative size-full">
        <Container5 />
        <Container6 />
        <Tabs />
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="pointer-events-none relative rounded-[9999px] shrink-0 size-[48px]" data-name="Avatar">
      <div className="absolute inset-0 overflow-hidden rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAvatar} />
      </div>
      <div aria-hidden="true" className="absolute border-2 border-[#fff8f6] border-solid inset-0 rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container9() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Avatar />
        <div className="absolute bg-[#006a65] bottom-0 right-0 rounded-[9999px] size-[14px]" data-name="Background+Border">
          <div aria-hidden="true" className="absolute border-2 border-[#fff8f6] border-solid inset-0 pointer-events-none rounded-[9999px]" />
        </div>
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip pr-[8px] top-0" data-name="Heading 3">
      <div className="flex flex-col font-['Lexend:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#241914] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">Sarah Jenkins</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <Heading2 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] left-[264.69px] not-italic text-[#a04100] text-[12px] top-[14px] whitespace-nowrap">
        <p className="leading-[16px]">Now</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#584238] text-[14px] w-full">
        <p className="leading-[20px]">Are we still on for the 6PM match?</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Container11 />
        <Container12 />
      </div>
    </div>
  );
}

function Background() {
  return (
    <div className="bg-[#a04100] content-stretch flex flex-col items-center min-w-[20px] pl-[6.88px] pr-[6.89px] py-[2px] relative rounded-[9999px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-white whitespace-nowrap">
        <p className="leading-[15px]">2</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-end relative size-full">
        <Background />
      </div>
    </div>
  );
}

function ActiveChatItem() {
  return (
    <div className="bg-[#ffdbcc] relative shrink-0 w-full" data-name="Active Chat Item">
      <div aria-hidden="true" className="absolute border-[#a04100] border-l-4 border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center pl-[20px] pr-[16px] py-[12px] relative size-full">
          <Container9 />
          <Container10 />
          <Container13 />
        </div>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="h-[12px] relative shrink-0 w-[24px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 12">
        <g id="Container">
          <path d={svgPaths.p23d26800} fill="var(--fill-0, #006F69)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[7.917px] relative shrink-0 w-[8.333px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.33333 7.91667">
        <g id="Container">
          <path d={svgPaths.p31e60680} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="absolute bg-[#ba1a1a] bottom-[-4px] content-stretch flex items-center justify-center p-[2px] right-[-4px] rounded-[9999px] size-[16px]" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border-2 border-[#fff8f6] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <Container15 />
    </div>
  );
}

function BackgroundShadow() {
  return (
    <div className="bg-[#6ef4ea] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative rounded-[8px] shrink-0 size-[48px]" data-name="Background+Shadow">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Container14 />
        <BackgroundBorder />
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip pr-[8px] top-0" data-name="Heading 3">
      <div className="flex flex-col font-['Lexend:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#241914] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">Downtown Hoopers</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <Heading3 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-[273.52px] not-italic text-[#584238] text-[12px] top-[14px] whitespace-nowrap">
        <p className="leading-[16px]">10:42 AM</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#241914] text-[14px] w-full">
        <p className="leading-[20px]">{`Mike: I'll bring the extra ball.`}</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Container17 />
        <Container18 />
      </div>
    </div>
  );
}

function GroupChatItem() {
  return (
    <div className="relative shrink-0 w-full" data-name="Group Chat Item">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0)] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center pb-[13px] pt-[12px] px-[16px] relative size-full">
          <BackgroundShadow />
          <Container16 />
        </div>
      </div>
    </div>
  );
}

function Avatar1() {
  return (
    <div className="relative rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 size-[48px]" data-name="Avatar">
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAvatar1} />
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Avatar1 />
    </div>
  );
}

function Heading4() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip pr-[8px] top-0" data-name="Heading 3">
      <div className="flex flex-col font-['Lexend:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#241914] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">Alex Rivera</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <Heading4 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-[270.66px] not-italic text-[#584238] text-[12px] top-[14px] whitespace-nowrap">
        <p className="leading-[16px]">Yesterday</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="h-[7.015px] relative shrink-0 w-[12.775px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.775 7.01458">
        <g id="Container">
          <path d={svgPaths.pfb5e518} fill="var(--fill-0, #006A65)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#584238] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Sounds good, see you there.</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Container">
      <Container23 />
      <Container24 />
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px relative" data-name="Container">
      <Container21 />
      <Container22 />
    </div>
  );
}

function RegularChatItem() {
  return (
    <div className="relative shrink-0 w-full" data-name="Regular Chat Item">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[16px] py-[12px] relative size-full">
          <Container19 />
          <Container20 />
        </div>
      </div>
    </div>
  );
}

function ConversationList() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="Conversation List">
      <div className="overflow-auto size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start py-[8px] relative size-full">
          <ActiveChatItem />
          <GroupChatItem />
          <RegularChatItem />
        </div>
      </div>
    </div>
  );
}

function AsideLeftPaneConversationList() {
  return (
    <div className="bg-[#fff8f6] content-stretch flex flex-col h-full items-start pr-px relative shrink-0 w-[420px] z-[2]" data-name="Aside - Left Pane: Conversation List">
      <div aria-hidden="true" className="absolute border-[#dfc0b3] border-r border-solid inset-0 pointer-events-none" />
      <ListHeaderSearch />
      <ConversationList />
    </div>
  );
}

function BackgroundShadow1() {
  return (
    <div className="bg-[#fff1eb] content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col items-start px-[12px] py-[4px] relative rounded-[9999px] shrink-0" data-name="Background+Shadow">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#584238] text-[12px] whitespace-nowrap">
        <p className="leading-[16px]">Today</p>
      </div>
    </div>
  );
}

function DateDivider() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Date Divider">
      <BackgroundShadow1 />
    </div>
  );
}

function DateDividerMargin() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[24px] py-[8px] right-[24px] top-[24px]" data-name="Date Divider:margin">
      <DateDivider />
    </div>
  );
}

function Container25() {
  return (
    <div className="h-[10.5px] relative shrink-0 w-[9.333px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 10.5">
        <g id="Container">
          <path d={svgPaths.p11e7d100} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function BackgroundShadow2() {
  return (
    <div className="bg-[#a04100] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative rounded-[9999px] shrink-0 size-[32px]" data-name="Background+Shadow">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Container25 />
      </div>
    </div>
  );
}

function Heading5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 4">
      <div className="flex flex-col font-['Lexend:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#a04100] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Match Found!</p>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#584238] text-[12px] whitespace-nowrap">
        <p className="leading-[16px]">You and Sarah are confirmed for 1v1 Tennis. Start coordinating!</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="relative shrink-0 w-[356.44px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
        <Heading5 />
        <Container27 />
      </div>
    </div>
  );
}

function BackgroundBorderShadowOverlayBlur() {
  return (
    <div className="backdrop-blur-[2px] bg-gradient-to-r from-[rgba(255,126,54,0.2)] max-w-[448px] relative rounded-[8px] self-stretch shrink-0 to-[rgba(110,244,234,0.2)] w-[448px]" data-name="Background+Border+Shadow+OverlayBlur">
      <div aria-hidden="true" className="absolute border border-[#ffb693] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <div className="content-stretch flex gap-[12px] items-start max-w-[inherit] p-[13px] relative size-full">
        <BackgroundShadow2 />
        <Container26 />
      </div>
    </div>
  );
}

function SystemMessageMatchFound() {
  return (
    <div className="absolute content-stretch flex h-[64px] items-start justify-center left-[24px] right-[24px] top-[88px]" data-name="System Message: Match Found">
      <BackgroundBorderShadowOverlayBlur />
    </div>
  );
}

function Avatar2() {
  return (
    <div className="max-w-[568.3900146484375px] relative rounded-[9999px] shrink-0 size-[24px]" data-name="Avatar">
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAvatar2} />
      </div>
    </div>
  );
}

function ImgAvatarMargin() {
  return (
    <div className="content-stretch flex flex-col h-[28px] items-start max-w-[568.3900146484375px] pb-[4px] relative shrink-0 w-[24px]" data-name="Img - Avatar:margin">
      <Avatar2 />
    </div>
  );
}

function BackgroundBorderShadow() {
  return (
    <div className="bg-[#f4ded5] content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col items-start px-[17px] py-[11px] relative rounded-bl-[2px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border border-[rgba(223,192,179,0.3)] border-solid inset-0 pointer-events-none rounded-bl-[2px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#241914] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">{`Hey! I'm super pumped for the match later.`}</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#584238] text-[10px] whitespace-nowrap">
        <p className="leading-[15px]">5:42 PM</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0" data-name="Container">
      <BackgroundBorderShadow />
      <Container29 />
    </div>
  );
}

function ReceivedMessage() {
  return (
    <div className="absolute content-stretch flex gap-[8px] items-end left-[24px] max-w-[602px] right-[267.61px] top-[176px]" data-name="Received Message">
      <ImgAvatarMargin />
      <Container28 />
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-[#a04100] content-stretch flex flex-col items-start px-[16px] py-[10px] relative rounded-bl-[16px] rounded-br-[2px] rounded-tl-[16px] rounded-tr-[16px] shrink-0" data-name="Background">
      <div className="absolute bg-[rgba(255,255,255,0)] inset-0 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]" data-name="Overlay+Shadow" />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">
        <p className="leading-[24px]">Same here! Did you want to meet at the main gate?</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#584238] text-[10px] whitespace-nowrap">
        <p className="leading-[15px]">5:45 PM</p>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="h-[6.012px] relative shrink-0 w-[10.95px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.95 6.0125">
        <g id="Container">
          <path d={svgPaths.p180b1d00} fill="var(--fill-0, #006A65)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container31() {
  return (
    <div className="content-stretch flex gap-[4px] items-center pr-[4px] relative shrink-0" data-name="Container">
      <Container32 />
      <Container33 />
    </div>
  );
}

function Container30() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0" data-name="Container">
      <Background1 />
      <Container31 />
    </div>
  );
}

function SentMessage() {
  return (
    <div className="absolute content-stretch flex items-end justify-center max-w-[602px] right-[24px] top-[265px]" data-name="Sent Message">
      <Container30 />
    </div>
  );
}

function Avatar3() {
  return (
    <div className="max-w-[568.3900146484375px] relative rounded-[9999px] shrink-0 size-[24px]" data-name="Avatar">
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAvatar3} />
      </div>
    </div>
  );
}

function ImgAvatarMargin1() {
  return (
    <div className="content-stretch flex flex-col h-[28px] items-start max-w-[568.3900146484375px] pb-[4px] relative shrink-0 w-[24px]" data-name="Img - Avatar:margin">
      <Avatar3 />
    </div>
  );
}

function CourtPreview() {
  return (
    <div className="absolute h-[236.13px] left-[9px] rounded-[12px] top-[9px] w-[366px]" data-name="Court preview">
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[12px]">
        <img alt="" className="absolute h-[100.2%] left-0 max-w-none top-[-0.1%] w-full" src={imgCourtPreview} />
      </div>
    </div>
  );
}

function BackgroundBorderShadow1() {
  return (
    <div className="bg-[#f4ded5] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] h-[306.13px] max-w-[384px] relative rounded-bl-[2px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-[384px]" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border border-[rgba(223,192,179,0.3)] border-solid inset-0 pointer-events-none rounded-bl-[2px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px]" />
      <CourtPreview />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-[17px] not-italic text-[#241914] text-[14px] top-[272.63px] whitespace-nowrap">
        <p className="leading-[20px] mb-0">Yeah, main gate is perfect. Court looks open right</p>
        <p className="leading-[20px]">now!</p>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#584238] text-[10px] whitespace-nowrap">
        <p className="leading-[15px]">5:48 PM</p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative" data-name="Container">
      <BackgroundBorderShadow1 />
      <Container35 />
    </div>
  );
}

function ReceivedMessageWithImageAttachmentUsingRequestedImagePlaceholder() {
  return (
    <div className="absolute content-stretch flex gap-[8px] items-end left-[24px] max-w-[602px] right-[267.61px] top-[352px]" data-name="Received Message with Image Attachment (Using requested image placeholder)">
      <ImgAvatarMargin1 />
      <Container34 />
    </div>
  );
}

function Container36() {
  return (
    <div className="h-[11.594px] relative shrink-0 w-[11.667px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.6667 11.5938">
        <g id="Container">
          <path d={svgPaths.p5be8780} fill="var(--fill-0, #006A65)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container37() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#241914] text-[12px] whitespace-nowrap">
          <p>
            <span className="leading-[16px]">{`Venue Booked: `}</span>
            <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16px] not-italic text-[#006a65]">Riverside Courts (Court 3)</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function OverlayBorderShadow() {
  return (
    <div className="bg-[rgba(110,244,234,0.2)] relative rounded-[9999px] self-stretch shrink-0" data-name="Overlay+Border+Shadow">
      <div aria-hidden="true" className="absolute border border-[rgba(0,106,101,0.3)] border-solid inset-0 pointer-events-none rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center px-[17px] py-[7px] relative size-full">
          <Container36 />
          <Container37 />
        </div>
      </div>
    </div>
  );
}

function SystemMessageVenueBooked() {
  return (
    <div className="content-stretch flex h-[30px] items-start justify-center relative shrink-0 w-full" data-name="System Message: Venue Booked">
      <OverlayBorderShadow />
    </div>
  );
}

function SystemMessageVenueBookedMargin() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[24px] py-[8px] right-[24px] top-[701.13px]" data-name="System Message: Venue Booked:margin">
      <SystemMessageVenueBooked />
    </div>
  );
}

function Avatar4() {
  return (
    <div className="max-w-[568.3900146484375px] relative rounded-[9999px] shrink-0 size-[24px]" data-name="Avatar">
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAvatar4} />
      </div>
    </div>
  );
}

function ImgAvatarMargin2() {
  return (
    <div className="content-stretch flex flex-col h-[28px] items-start max-w-[568.3900146484375px] pb-[4px] relative shrink-0 w-[24px]" data-name="Img - Avatar:margin">
      <Avatar4 />
    </div>
  );
}

function BackgroundBorderShadow2() {
  return (
    <div className="bg-[#f4ded5] content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col items-start px-[17px] py-[11px] relative rounded-bl-[2px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border border-[rgba(223,192,179,0.3)] border-solid inset-0 pointer-events-none rounded-bl-[2px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px]" />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#241914] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">Are we still on for the 6PM match?</p>
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#a04100] text-[10px] whitespace-nowrap">
        <p className="leading-[15px]">Just now</p>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0" data-name="Container">
      <BackgroundBorderShadow2 />
      <Container39 />
    </div>
  );
}

function ReceivedMessageTheUnreadOne() {
  return (
    <div className="absolute content-stretch flex gap-[8px] items-end left-[24px] max-w-[602px] right-[267.61px] top-[775.13px]" data-name="Received Message (The unread one)">
      <ImgAvatarMargin2 />
      <Container38 />
    </div>
  );
}

function Avatar5() {
  return (
    <div className="max-w-[568.3900146484375px] relative rounded-[9999px] shrink-0 size-[24px]" data-name="Avatar">
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAvatar5} />
      </div>
    </div>
  );
}

function ImgAvatarMargin3() {
  return (
    <div className="content-stretch flex flex-col h-[28px] items-start max-w-[568.3900146484375px] pb-[4px] relative shrink-0 w-[24px]" data-name="Img - Avatar:margin">
      <Avatar5 />
    </div>
  );
}

function BackgroundShadow3() {
  return (
    <div className="bg-[#f4ded5] content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex gap-[4px] h-[40px] items-center px-[16px] py-[12px] relative rounded-bl-[2px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0" data-name="Background+Shadow">
      <div className="bg-[#584238] relative rounded-[9999px] shrink-0 size-[6px]" data-name="Background" />
      <div className="bg-[#584238] relative rounded-[9999px] shrink-0 size-[6px]" data-name="Background" />
      <div className="bg-[#584238] relative rounded-[9999px] shrink-0 size-[6px]" data-name="Background" />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="absolute content-stretch flex gap-[8px] items-end left-[24px] max-w-[602px] opacity-70 right-[267.61px] top-[864.13px]" data-name="Typing indicator">
      <ImgAvatarMargin3 />
      <BackgroundShadow3 />
    </div>
  );
}

function ChatMessagesCanvas() {
  return (
    <div className="absolute bg-white inset-[81px_0_95px_0]" data-name="Chat Messages Canvas">
      <DateDividerMargin />
      <SystemMessageMatchFound />
      <ReceivedMessage />
      <SentMessage />
      <ReceivedMessageWithImageAttachmentUsingRequestedImagePlaceholder />
      <SystemMessageVenueBookedMargin />
      <ReceivedMessageTheUnreadOne />
      <TypingIndicator />
    </div>
  );
}

function Container40() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Container">
          <path d={svgPaths.p2d8e4cc0} fill="var(--fill-0, #584238)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button5() {
  return (
    <div className="relative rounded-[9999px] shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center p-[10px] relative size-full">
        <Container40 />
      </div>
    </div>
  );
}

function Container41() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-[rgba(88,66,56,0.7)] w-full">
        <p className="leading-[24px]">Type a message...</p>
      </div>
    </div>
  );
}

function Textarea() {
  return (
    <div className="flex-[1_0_0] max-h-[128px] min-h-[44px] min-w-px relative" data-name="Textarea">
      <div className="max-h-[inherit] min-h-[inherit] overflow-auto size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start max-h-[inherit] min-h-[inherit] p-[12px] relative size-full">
          <Container41 />
        </div>
      </div>
    </div>
  );
}

function Container43() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Container">
          <path d={svgPaths.p2ff998c0} fill="var(--fill-0, #584238)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button6() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[8px] relative rounded-[9999px] shrink-0" data-name="Button">
      <Container43 />
    </div>
  );
}

function Container44() {
  return (
    <div className="h-[19px] relative shrink-0 w-[14px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 19">
        <g id="Container">
          <path d={svgPaths.p39e29d00} fill="var(--fill-0, #584238)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button7() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[8px] relative rounded-[9999px] shrink-0" data-name="Button">
      <Container44 />
    </div>
  );
}

function Container45() {
  return (
    <div className="h-[13.333px] relative shrink-0 w-[15.833px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.8333 13.3333">
        <g id="Container">
          <path d={svgPaths.p2591fc80} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button8() {
  return (
    <div className="bg-[#a04100] content-stretch flex items-center justify-center pl-[11px] pr-[9px] relative rounded-[9999px] shrink-0 size-[40px]" data-name="Button">
      <div className="-translate-y-1/2 absolute bg-[rgba(255,255,255,0)] left-0 rounded-[9999px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] size-[40px] top-1/2" data-name="Button:shadow" />
      <Container45 />
    </div>
  );
}

function ButtonMargin() {
  return (
    <div className="content-stretch flex flex-col h-[40px] items-start pl-[4px] relative shrink-0 w-[44px]" data-name="Button:margin">
      <Button8 />
    </div>
  );
}

function Container42() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center pb-[4px] pr-[4px] relative size-full">
        <Button6 />
        <Button7 />
        <ButtonMargin />
      </div>
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="bg-[#fff1eb] max-w-[896px] relative rounded-[16px] shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(223,192,179,0.5)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-end max-w-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-end max-w-[inherit] p-[7px] relative size-full">
          <Button5 />
          <Textarea />
          <Container42 />
        </div>
      </div>
    </div>
  );
}

function FooterChatInputArea() {
  return (
    <div className="absolute bg-[#fff8f6] content-stretch drop-shadow-[0px_-4px_5px_rgba(0,106,101,0.05)] flex flex-col items-start left-0 pb-[16px] pt-[17px] px-[16px] right-0 top-[856px]" data-name="Footer - Chat Input Area">
      <div aria-hidden="true" className="absolute border-[#dfc0b3] border-solid border-t inset-0 pointer-events-none" />
      <BackgroundBorder1 />
    </div>
  );
}

function SarahJenkins() {
  return (
    <div className="pointer-events-none relative rounded-[9999px] shrink-0 size-[48px]" data-name="Sarah Jenkins">
      <div className="absolute inset-0 overflow-hidden rounded-[9999px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgSarahJenkins} />
      </div>
      <div aria-hidden="true" className="absolute border-2 border-[#fff8f6] border-solid inset-0 rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container47() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <SarahJenkins />
      <div className="absolute bg-[#006a65] bottom-0 right-0 rounded-[9999px] size-[12px]" data-name="Background+Border">
        <div aria-hidden="true" className="absolute border-2 border-[#fff8f6] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="flex flex-col font-['Lexend:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#241914] text-[20px] whitespace-nowrap">
        <p className="leading-[28px]">Sarah Jenkins</p>
      </div>
    </div>
  );
}

function Container49() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#006a65] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Online now • 1.2 miles away</p>
      </div>
    </div>
  );
}

function Container48() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[187.64px]" data-name="Container">
      <Heading1 />
      <Container49 />
    </div>
  );
}

function Container46() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center relative size-full">
        <Container47 />
        <Container48 />
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Container">
          <path d={svgPaths.p143e1930} fill="var(--fill-0, #584238)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button9() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px]" data-name="Button">
      <Container51 />
    </div>
  );
}

function Container52() {
  return (
    <div className="h-[16px] relative shrink-0 w-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 16">
        <g id="Container">
          <path d={svgPaths.p3dfc3600} fill="var(--fill-0, #584238)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button10() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px]" data-name="Button">
      <Container52 />
    </div>
  );
}

function Container53() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Container">
          <path d={svgPaths.p6c8ea80} fill="var(--fill-0, #584238)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button11() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[40px]" data-name="Button">
      <Container53 />
    </div>
  );
}

function Container50() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center relative size-full">
        <Button9 />
        <Button10 />
        <Button11 />
      </div>
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="absolute bg-[#fff8f6] content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center justify-between left-0 pb-[17px] pt-[16px] px-[24px] right-0 top-0" data-name="Chat Header">
      <div aria-hidden="true" className="absolute border-[#dfc0b3] border-b border-solid inset-0 pointer-events-none" />
      <Container46 />
      <Container50 />
    </div>
  );
}

function SectionRightPaneActiveChatWindow() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-w-px relative z-[1]" data-name="Section - Right Pane: Active Chat Window">
      <ChatMessagesCanvas />
      <FooterChatInputArea />
      <ChatHeader />
    </div>
  );
}

function MainChatHubArea() {
  return (
    <div className="content-stretch flex flex-[1_0_0] isolate items-start max-w-[1600px] min-h-px overflow-clip relative w-full z-[1]" data-name="Main Chat Hub Area">
      <AsideLeftPaneConversationList />
      <SectionRightPaneActiveChatWindow />
    </div>
  );
}

export default function HtmlBody() {
  return (
    <div className="content-stretch flex flex-col isolate items-start relative size-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(255, 248, 246) 0%, rgb(255, 248, 246) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="Html → Body">
      <HeaderTopAppBarSemanticShell />
      <MainChatHubArea />
    </div>
  );
}