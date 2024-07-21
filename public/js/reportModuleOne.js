export const reportModuleOne = () => {
    return `
        <div style="display: flex; flex-direction: column; width: 100%; height: 500px; background-color: lightgrey; border-radius: 10px">
            <div style="display: flex; justify-content: center">
                <div class="title-container" style="margin-left: 0; color: black; border: solid 4px black; padding-bottom: 6px" >
                    <div style="font-size: 22px; font-family: 'BM Hanna Pro', sans-serif">
                        SCENT NAME
                    </div>
                </div>
            </div>

            <div style="display: flex; justify-content: center">
                <div class="recommend-name-container">
                    <div id="targetNameRecommend" style="font-size: 30px"></div>
                </div>
            </div>

            <div class="report-container" style="padding-bottom: 20px; margin-top: 10px; margin-bottom: 10px; border: 0; border-radius: 20px">
                <div style="display: flex; justify-content: flex-start; align-content: center; margin-left: 10px">
                    <div class="title-container">
                        <div style="font-size: 22px; font-family: 'BM Hanna Pro', sans-serif">
                            이미지 분석 결과
                        </div>
                        <div style="margin-left: 5px; margin-top: 4px">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1); align-self: center;">
                                <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                <div style="padding-top: 10px" class="note-container" id="targetInsight"></div>
            </div>
        </div>
    `;
};
