import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import type { Period } from "./types";
import { gsap } from "gsap";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import ArrowLeft from "../../assets/arrow-left.svg";
import ArrowRight from "../../assets/arrow-right.svg";
import ArrowLeftMobile from "../../assets/arrow-left-mobile.svg";
import ArrowRightMobile from "../../assets/arrow-right-mobile.svg";

type Props = {
  title: string;
  periods: Period[];
};

type Point = { i: number; x: number; y: number; angleDeg: number };

const ACTIVE_ANGLE_DEG = -30;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function TimelineWheel({ title, periods }: Readonly<Props>) {
  if (periods.length < 1 || periods.length > 6) {
    throw new Error(`periods must be 1..6, got ${periods.length}`);
  }

  const [active, setActive] = useState(0);
  const activePeriod = periods[active];

  const [hovered, setHovered] = useState<number | null>(null);

  const rotationRef = useRef({ value: 0 });
  const [rotationDeg, setRotationDeg] = useState(0);

  const [displayYears, setDisplayYears] = useState(() => ({
    from: periods[0].from,
    to: periods[0].to,
  }));

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sliderWrapRef = useRef<HTMLDivElement | null>(null);
  const activeBubbleRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<any>(null);

  const baseAngles = useMemo(() => {
    const n = periods.length;
    const startDeg = -30;
    const stepDeg = 360 / n;
    return Array.from({ length: n }, (_, i) => startDeg + i * stepDeg);
  }, [periods.length]);

  const points: Point[] = useMemo(() => {
    const cx = 0.5;
    const cy = 0.5;
    const r = 0.5;

    return baseAngles.map((base, i) => {
      const angleDeg = base + rotationDeg;
      const rad = (Math.PI / 180) * angleDeg;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      return { i, x, y, angleDeg };
    });
  }, [baseAngles, rotationDeg]);

  useEffect(() => {
    const target = ACTIVE_ANGLE_DEG - baseAngles[active];
    const current = rotationRef.current.value;

    let delta = target - current;

    delta = ((delta + 180) % 360) - 180;

    const finalRotation = current + delta;

    gsap.to(rotationRef.current, {
      value: finalRotation,
      duration: 0.8,
      ease: "power3.out",
      onUpdate: () => {
        setRotationDeg(rotationRef.current.value);
      },
    });
  }, [active, baseAngles]);

  useEffect(() => {
    const obj = { from: displayYears.from, to: displayYears.to };

    const tl = gsap.timeline();
    tl.to(obj, {
      from: activePeriod.from,
      to: activePeriod.to,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayYears({
          from: Math.round(obj.from),
          to: Math.round(obj.to),
        });
      },
    });

    return () => {
      tl.kill();
    };
  }, [activePeriod.from, activePeriod.to]);

  useEffect(() => {
    const el = sliderWrapRef.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
  }, [activePeriod.id]);

  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.slideTo(0, 0);
    }
  }, [activePeriod.id]);

  useEffect(() => {
    const el = activeBubbleRef.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" },
    );
  }, [activePeriod.id]);

  const total = periods.length;
  const counterText = `${pad2(active + 1)}/${pad2(total)}`;

  const isDesktop = useMemo(
    () => globalThis.matchMedia("(min-width: 768px)").matches,
    [],
  );

  return (
    <Root>
      <Lines />

      <Hero>
        <TitleBlock>
          <Title>{title}</Title>
        </TitleBlock>

        <YearsOverlay>
          <BigFrom>{displayYears.from}</BigFrom>
          <BigTo>{displayYears.to}</BigTo>
        </YearsOverlay>

        <WheelWrap>
          <Wheel>
            <WheelSvg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="50" />
            </WheelSvg>

            {points.map((p) => {
              const i = p.i;
              const isActive = i === active;

              const period = periods[i];

              return (
                <PointBtn
                  key={period.id}
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                  type="button"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered((h) => (h === i ? null : h))}
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                  aria-label={`Направление ${period.label}. Период ${period.from}–${period.to}`}
                >
                  <PointBubble
                    $active={isActive}
                    $visible={isActive || hovered === i}
                  >
                    {i + 1}
                  </PointBubble>
                  {isActive && <PointLabel>{period.label}</PointLabel>}
                </PointBtn>
              );
            })}
          </Wheel>
        </WheelWrap>

        {isDesktop && (
          <Controls>
            <Counter>{counterText}</Counter>

            <CtrlButtons>
              <CtrlBtn
                type="button"
                disabled={active === 0}
                onClick={() => {
                  if (active === 0) return;
                  setActive((a) => a - 1);
                }}
                aria-label="Предыдущее направление"
              >
                <ArrowLeft />
              </CtrlBtn>
              <CtrlBtn
                type="button"
                disabled={active === total - 1}
                onClick={() => {
                  if (active === total - 1) return;
                  setActive((a) => a + 1);
                }}
                aria-label="Следующее направление"
              >
                <ArrowRight />
              </CtrlBtn>
            </CtrlButtons>
          </Controls>
        )}

        <Divider />
      </Hero>

      <SliderWrap ref={sliderWrapRef}>
        {canPrev && (
          <EventNavLeft
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Предыдущие события"
          >
            <EventCircle>
              <EventArrowLeft />
            </EventCircle>
          </EventNavLeft>
        )}

        {canNext && (
          <EventNavRight
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Следующие события"
          >
            <EventCircle>
              <EventArrowRight />
            </EventCircle>
          </EventNavRight>
        )}
        <Swiper
          modules={[Pagination]}
          key={activePeriod.id}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setCanPrev(!swiper.isBeginning);
            setCanNext(!swiper.isEnd);
          }}
          breakpoints={{
            0: {
              slidesPerView: "auto",
              spaceBetween: 25,
              slidesOffsetBefore: 20,
              slidesOffsetAfter: 20,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 80,
              slidesOffsetBefore: 0,
              slidesOffsetAfter: 0,
            },
          }}
          onSlideChange={(swiper) => {
            setCanPrev(!swiper.isBeginning);
            setCanNext(!swiper.isEnd);
          }}
          pagination={{
            clickable: true,
          }}
        >
          {activePeriod.events.map((ev) => (
            <SwiperSlide key={ev.id}>
              <Card>
                <CardYear>{ev.year}</CardYear>
                {ev.description && <CardDesc>{ev.description}</CardDesc>}
              </Card>
            </SwiperSlide>
          ))}
          {!isDesktop && (
            <Controls>
              <Counter>{counterText}</Counter>

              <CtrlButtons>
                <CtrlBtn
                  type="button"
                  disabled={active === 0}
                  onClick={() => {
                    if (active === 0) return;
                    setActive((a) => a - 1);
                  }}
                  aria-label="Предыдущее направление"
                >
                  <ArrowLeftMobile />
                </CtrlBtn>
                <CtrlBtn
                  type="button"
                  disabled={active === total - 1}
                  onClick={() => {
                    if (active === total - 1) return;
                    setActive((a) => a + 1);
                  }}
                  aria-label="Следующее направление"
                >
                  <ArrowRightMobile />
                </CtrlBtn>
              </CtrlButtons>
            </Controls>
          )}
        </Swiper>
      </SliderWrap>
    </Root>
  );
}

/* ===== styled-components ===== */

const Root = styled.section`
  min-width: 320px;
  min-height: 100vh;
  padding: 60px 0px 32px 0px;

  display: flex;
  flex-direction: column;
  gap: 20px;

  @media screen and (min-width: 768px) {
    position: relative;
    margin: 0 160px 0 320px;
    min-width: 1200px;
    min-height: 1080px;
    padding: 0;
    gap: 0;

    &::before,
    &::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: rgba(0, 0, 0, 0.06);
      pointer-events: none;
    }

    &::before {
      left: 0;
    }

    &::after {
      right: 0;
    }
  }
`;

const Hero = styled.div`
  padding: 0 20px;

  display: flex;
  flex-direction: column;
  gap: 60px;
  flex: 1;

  @media screen and (min-width: 768px) {
    position: relative;
    justify-content: center;
    align-items: center;
  }
`;

const TitleBlock = styled.div`
  align-self: flex-start;
  width: 40%;

  @media screen and (min-width: 768px) {
    position: absolute;
    left: 0;
    top: 80px;
  }
`;

const Title = styled.h2`
  font-size: 20px;
  line-height: 1.05;
  font-weight: 700;
  color: #42567a;

  @media screen and (min-width: 768px) {
    position: relative;
    padding-left: 80px;
    max-width: 430px;
    word-break: break-word;
    font-size: 56px;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      width: 5px;
      height: 100%;
      background: linear-gradient(180deg, #3877ee 0%, #ef5da8 100%);
    }
  }
`;

const Divider = styled.div`
  border: 1px solid #c7cdd9;
  width: 100%;

  @media screen and (min-width: 768px) {
    display: none;
  }
`;

const Lines = styled.div`
  display: none;

  @media screen and (min-width: 768px) {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: -1;
    display: block;
    margin-top: -260px;

    background-image:
      linear-gradient(
        to right,
        transparent calc(50% - 1px),
        rgba(0, 0, 0, 0.06) calc(50% - 1px),
        rgba(0, 0, 0, 0.06) calc(50% + 1px),
        transparent calc(50% + 1px)
      ),
      linear-gradient(
        to bottom,
        transparent calc(50% - 1px),
        rgba(0, 0, 0, 0.06) calc(50% - 1px),
        rgba(0, 0, 0, 0.06) calc(50% + 1px),
        transparent calc(50% + 1px)
      );
    background-repeat: no-repeat;
    background-size:
      100% 100%,
      100% 100%;
    background-position: center;
  }
`;

const YearsOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  gap: 30px;

  @media screen and (min-width: 768px) {
    position: absolute;
    inset: 0;
    gap: 80px;
  }
`;

const BigFrom = styled.div`
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  color: #3877ee;

  @media screen and (min-width: 768px) {
    font-size: 200px;
  }
`;

const BigTo = styled.div`
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  color: #ef5da8;

  @media screen and (min-width: 768px) {
    font-size: 200px;
  }
`;

const WheelWrap = styled.div`
  display: none;

  @media screen and (min-width: 768px) {
    position: absolute;
    margin: 0 auto;
    display: block;
    // display: flex;
    // justify-content: center;
    // align-items: center;
  }
`;

const Wheel = styled.div`
  position: relative;
  width: 530px;
  aspect-ratio: 1 / 1;
`;

const WheelSvg = styled.svg`
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;

  circle {
    fill: transparent;
    stroke: rgba(0, 0, 0, 0.06);
    stroke-width: 0.6;
  }
`;

const PointBtn = styled.button`
  position: absolute;
  transform: translate(-50%, -50%);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
`;

const PointLabel = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;

  transform: translate(40px, -50%);

  white-space: nowrap;

  font-size: 20px;
  font-weight: 700;
  color: #42567a;

  pointer-events: none;
`;

const PointBubble = styled.div<{
  $active: boolean;
  $visible: boolean;
}>`
  position: absolute;
  left: 50%;
  top: 50%;

  transform: translate(-50%, -50%);

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;
  font-weight: 600;

  transition: all 0.25s ease;

  ${({ $visible }) =>
    $visible
      ? `
    width: 56px;
    height: 56px;
    background: white;
    border: 1px solid #42567a;
    font-size: 16px;
  `
      : `
    width: 8px;
    height: 8px;
    background: #42567a;
    font-size: 0;
  `}
`;

const Controls = styled.div`
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 8px;

  padding: 0 20px;

  @media screen and (min-width: 768px) {
    position: absolute;
    left: 80px;
    bottom: 100px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 0;
  }
`;

const Counter = styled.div`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
`;

const CtrlButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const CtrlBtn = styled.button`
  width: 25px;
  height: 25px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;

  display: grid;
  place-items: center;

  color: #42567a;

  svg {
    display: block;
    width: 25px;
    height: 25px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
    pointer-events: none;
  }

  @media screen and (min-width: 768px) {
    width: 50px;
    height: 50px;

    svg {
      display: block;
      width: 50px;
      height: 50px;
    }
  }
`;

const SliderWrap = styled.div`
  .swiper-slide {
    width: 160px;
  }

  .swiper-pagination {
    position: static;
    margin-top: 60px;
    text-align: center;
  }

  .swiper-pagination-bullet {
    background: #42567a;
    opacity: 0.4;
  }

  .swiper-pagination-bullet-active {
    opacity: 1;
  }

  @media screen and (min-width: 768px) {
    position: relative;
    padding: 0 80px 80px 80px;

    .swiper-slide {
      width: 320px;
    }

    .swiper-pagination {
      display: none;
    }
  }
`;

const EventNavBtn = styled.button`
  position: absolute;
  top: 80px;
  transform: translateY(-50%);

  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;

  display: grid;
  place-items: center;

  svg {
    width: 70px;
    height: 70px;
    display: block;
  }

  &:active {
    transform: translateY(-50%) scale(0.98);
  }
`;

const EventCircle = styled.div`
  position: relative;

  width: 40px;
  height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: "";
    width: 40px;
    height: 40px;
    border-radius: 50%;

    background: white;

    box-shadow: 0 0 30px rgba(56, 119, 238, 0.18);
  }
`;

const EventArrowRight = styled.div`
  position: absolute;

  width: 10px;
  height: 10px;

  border-top: 2px solid #3877ee;
  border-right: 2px solid #3877ee;

  transform: translate(-50%, -50%) rotate(45deg);

  top: 50%;
  left: 50%;
`;

const EventArrowLeft = styled.div`
  position: absolute;

  width: 10px;
  height: 10px;

  border-top: 2px solid #3877ee;
  border-right: 2px solid #3877ee;

  transform: translate(-50%, -50%) rotate(-135deg);

  top: 50%;
  left: 50%;
`;

const EventNavLeft = styled(EventNavBtn)`
  display: none;

  @media screen and (min-width: 768px) {
    display: block;
    left: 20px;
  }
`;

const EventNavRight = styled(EventNavBtn)`
  display: none;

  @media screen and (min-width: 768px) {
    display: block;
    right: 20px;
  }
`;

const Card = styled.article`
  width: 160px;
  height: 120px;

  @media screen and (min-width: 768px) {
    width: 320px;
    height: 160px;
  }
`;

const CardYear = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #3877ee;

  @media screen and (min-width: 768px) {
    font-size: 25px;
  }
`;

const CardDesc = styled.div`
  margin-top: 15px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);

  @media screen and (min-width: 768px) {
    font-size: 20px;
  }
`;
