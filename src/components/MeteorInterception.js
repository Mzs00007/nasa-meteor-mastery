import React, { useState } from 'react';

const MeteorInterception = () => {
  const [interceptorLaunched, setInterceptorLaunched] = useState(false);
  const [interceptionSuccess, setInterceptionSuccess] = useState(null);

  const launchInterceptor = () => {
    setInterceptorLaunched(true);
    setTimeout(() => {
      setInterceptionSuccess(Math.random() > 0.3);
    }, 1500);
  };

  const resetInterception = () => {
    setInterceptorLaunched(false);
    setInterceptionSuccess(null);
  };

  return (
    <div className='w3-container w3-margin'>
      <div className='w3-card-4 w3-round-large'>
        <header className='w3-container w3-blue'>
          <h3>Meteor Interception</h3>
        </header>

        <div className='w3-row-padding w3-padding'>
          <div className='w3-col m6 s12'>
            <div className='w3-center w3-padding'>
              {!interceptorLaunched ? (
                <div>
                  <div style={{ fontSize: '48px' }}>🌍</div>
                  <p>Earth Defense Ready</p>
                </div>
              ) : interceptionSuccess === null ? (
                <div>
                  <div style={{ fontSize: '48px' }}>🌍</div>
                  <div style={{ fontSize: '24px' }}>🚀</div>
                  <p>Intercepting...</p>
                </div>
              ) : interceptionSuccess ? (
                <div>
                  <div style={{ fontSize: '48px' }}>🌍</div>
                  <div style={{ fontSize: '36px' }}>💥</div>
                  <p className='w3-text-green'>Success!</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '48px' }}>🌍</div>
                  <div style={{ fontSize: '24px' }}>☄️</div>
                  <p className='w3-text-red'>Failed!</p>
                </div>
              )}
            </div>
          </div>

          <div className='w3-col m6 s12'>
            <div className='w3-padding'>
              {!interceptorLaunched ? (
                <button
                  onClick={launchInterceptor}
                  className='w3-button w3-red w3-round w3-block'
                >
                  Launch Interceptor
                </button>
              ) : interceptionSuccess === null ? (
                <div className='w3-center'>
                  <p>Interceptor in flight...</p>
                </div>
              ) : (
                <div className='w3-center'>
                  <p>
                    {interceptionSuccess
                      ? 'Threat neutralized!'
                      : 'Mission failed!'}
                  </p>
                  <button
                    onClick={resetInterception}
                    className='w3-button w3-blue w3-round w3-block'
                  >
                    Reset
                  </button>
                </div>
              )}

              <div className='w3-section w3-center'>
                <div className='w3-hide-large w3-hide-medium'>
                  <span className='w3-tag'>Mobile Optimized</span>
                </div>
                <div className='w3-hide-small'>
                  <span className='w3-tag'>Desktop Enhanced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeteorInterception;
